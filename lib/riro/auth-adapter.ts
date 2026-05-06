export type RiroAuthInput = {
  loginId: string;
  password: string;
};

export type RiroAuthResult = {
  ok: true;
  realName: string;
  studentNumber: string;
  generation: number;
  role: 'USER' | 'ADMIN';
} | {
  ok: false;
  message: string;
};

export type RiroAuthAdapter = (input: RiroAuthInput) => Promise<RiroAuthResult>;

function deriveStudentNumber(loginId: string) {
  const digits = loginId.replace(/\D/g, '');
  if (digits.length >= 4) return digits.slice(0, 4);
  return `26${digits.padStart(2, '0')}`;
}

export const mockRiroAuth: RiroAuthAdapter = async ({ loginId, password }) => {
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (!loginId.trim() || password.length < 4) {
    return { ok: false, message: '리로스쿨 ID와 4자 이상의 비밀번호를 입력해 주세요.' };
  }

  const normalized = loginId.trim().toLowerCase();
  const studentNumber = deriveStudentNumber(normalized);
  // ISHS_Wiki의 check_riro_login 방식처럼 리로 ID 앞 두 자리 연도에서 기수를 유도한다.
  const generation = Number(`20${studentNumber.slice(0, 2)}`) - 1994 + 1;

  return {
    ok: true,
    realName: normalized.startsWith('admin') ? '관리자' : `인증학생${studentNumber}`,
    studentNumber,
    generation: Number.isFinite(generation) && generation > 0 ? generation : 0,
    role: normalized.startsWith('admin') ? 'ADMIN' : 'USER'
  };
};

// Replace this export with a real RiroSchool / ISHS_Wiki check_riro_login adapter in production.
export const riroAuthAdapter: RiroAuthAdapter = mockRiroAuth;
