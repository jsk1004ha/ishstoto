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

type RiroAuthSuccess = Extract<RiroAuthResult, { ok: true }>;
type RiroProfile = Pick<RiroAuthSuccess, 'realName' | 'studentNumber' | 'role'> & Partial<Pick<RiroAuthSuccess, 'generation'>>;
type CookieStore = Record<string, string>;

const RIRO_BASE_URL = 'https://iscience.riroschool.kr';
const RIRO_SIGNIN_PATH = '/user.php?action=signin';
const RIRO_LOGIN_PATH = '/ajax.php';

const knownProfiles: Record<string, RiroProfile> = {
  // Verified local identity profile used as a fallback only after Riro login succeeds.
  '2510': { realName: '김준서', studentNumber: '2309', generation: 32, role: 'USER' }
};

function normalizeLoginId(loginId: string) {
  return loginId.trim().toLowerCase();
}

function deriveStudentNumber(loginId: string) {
  const digits = loginId.replace(/\D/g, '');
  if (digits.length >= 4) return digits.slice(0, 4);
  return `26${digits.padStart(2, '0')}`;
}

function deriveGenerationFromYearPrefix(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 2) return 0;

  // ISHS 기수는 리로 로그인 ID의 앞 두 자리 입학연도 기준으로 산출된다.
  // 예: 25xx -> 2025 - 1994 + 1 = 32기.
  const generation = Number(`20${digits.slice(0, 2)}`) - 1994 + 1;
  return Number.isFinite(generation) && generation > 0 ? generation : 0;
}

function resolveGeneration({ explicitGeneration, loginId, studentNumber }: { explicitGeneration?: number; loginId: string; studentNumber: string }) {
  if (explicitGeneration && explicitGeneration > 0) return explicitGeneration;

  const generationFromLoginId = deriveGenerationFromYearPrefix(loginId);
  if (generationFromLoginId > 0) return generationFromLoginId;

  return deriveGenerationFromYearPrefix(studentNumber);
}

function completeProfile(profile: RiroProfile, loginId: string): RiroAuthSuccess {
  return {
    ok: true,
    ...profile,
    generation: resolveGeneration({ explicitGeneration: profile.generation, loginId, studentNumber: profile.studentNumber })
  };
}

export const mockRiroAuth: RiroAuthAdapter = async ({ loginId, password }) => {
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (!loginId.trim() || password.length < 4) {
    return { ok: false, message: '리로스쿨 ID와 4자 이상의 비밀번호를 입력해 주세요.' };
  }

  const normalized = normalizeLoginId(loginId);
  const profile = knownProfiles[normalized];
  if (profile) return completeProfile(profile, normalized);

  const studentNumber = deriveStudentNumber(normalized);
  const generation = resolveGeneration({ loginId: normalized, studentNumber });

  return {
    ok: true,
    realName: normalized.startsWith('admin') ? '관리자' : `인증학생${studentNumber}`,
    studentNumber,
    generation,
    role: normalized.startsWith('admin') ? 'ADMIN' : 'USER'
  };
};

function getHeaderSetCookies(headers: Headers) {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = withGetSetCookie.getSetCookie?.();
  if (setCookies?.length) return setCookies;

  const combined = headers.get('set-cookie');
  return combined ? splitCombinedSetCookieHeader(combined) : [];
}

function splitCombinedSetCookieHeader(header: string) {
  return header.split(/,(?=\s*[^;,=]+=[^;,]+)/g).map((part) => part.trim()).filter(Boolean);
}

function storeSetCookies(headers: Headers, cookies: CookieStore) {
  for (const setCookie of getHeaderSetCookies(headers)) {
    const [pair] = setCookie.split(';');
    const separator = pair.indexOf('=');
    if (separator <= 0) continue;

    const key = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (value === 'deleted') delete cookies[key];
    else cookies[key] = value;
  }
}

function cookieHeader(cookies: CookieStore) {
  return Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join('; ');
}

function toRiroUrl(pathOrUrl: string) {
  const url = new URL(pathOrUrl, RIRO_BASE_URL);
  if (url.origin !== RIRO_BASE_URL) throw new Error('UNSAFE_RIRO_REDIRECT');
  return url;
}

async function riroFetch(pathOrUrl: string, init: RequestInit, cookies: CookieStore, remainingRedirects = 3): Promise<Response> {
  const url = toRiroUrl(pathOrUrl);
  const headers = new Headers(init.headers);
  const existingCookies = cookieHeader(cookies);
  if (existingCookies) headers.set('cookie', existingCookies);

  const response = await fetch(url, {
    ...init,
    headers,
    redirect: 'manual'
  });
  storeSetCookies(response.headers, cookies);

  if (remainingRedirects > 0 && response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (location) {
      return riroFetch(location, {
        method: 'GET',
        headers: init.headers
      }, cookies, remainingRedirects - 1);
    }
  }

  return response;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function htmlToText(html: string) {
  return decodeHtmlEntities(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/+(?:p|div|li|tr|td|th|span|label|strong|em|h\d)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

type HtmlAttributeMap = Record<string, string>;

function htmlAttributesToText(html: string) {
  const lines: string[] = [];
  const gradeClassNumber: Partial<Record<'grade' | 'classNumber' | 'number', string>> = {};

  for (const match of html.matchAll(/<[^>]+>/g)) {
    const attributes = parseHtmlAttributes(match[0]);
    const keyText = [
      attributes.name,
      attributes.id,
      attributes.class,
      attributes.placeholder,
      attributes.title,
      attributes['aria-label']
    ].filter(Boolean).join(' ').toLowerCase();
    const value = attributes.value ?? attributes['data-value'] ?? '';

    for (const [attributeName, attributeValue] of Object.entries(attributes)) {
      if (attributeName === 'data-name' && /^[가-힣]{2,5}$/.test(attributeValue)) lines.push(`이름 ${attributeValue}`);
      if ((attributeName === 'data-num' || attributeName === 'data-number') && /^\d{4}$/.test(attributeValue)) lines.push(`학번 ${attributeValue}`);
    }

    if (!value) continue;
    if (/(?:real_?name|user_?name|student_?name|member_?name|m_?name|name|성명|실명|이름)/i.test(keyText) && /^[가-힣]{2,5}$/.test(value)) {
      lines.push(`이름 ${value}`);
    }
    if (/(?:student_?(?:number|no|id)|std_?(?:number|no|id)|stu_?(?:number|no|id)|hakbun|school_?number|학번|학생번호)/i.test(keyText) && /^\d{4}$/.test(value)) {
      lines.push(`학번 ${value}`);
    }
    if (/(?:generation|gisu|기수)/i.test(keyText) && /^\d{1,2}$/.test(value)) {
      lines.push(`기수 ${value}기`);
    }
    if (/(?:grade|haknyeon|학년)/i.test(keyText) && /^[1-3]$/.test(value)) gradeClassNumber.grade = value;
    if (/(?:class|ban|반)/i.test(keyText) && /^\d{1,2}$/.test(value)) gradeClassNumber.classNumber = value;
    if (/(?:number|num|no|bun|번)/i.test(keyText) && /^\d{1,2}$/.test(value)) gradeClassNumber.number = value;
  }

  if (gradeClassNumber.grade && gradeClassNumber.classNumber && gradeClassNumber.number) {
    lines.push(`${gradeClassNumber.grade}학년 ${gradeClassNumber.classNumber}반 ${gradeClassNumber.number}번`);
  }

  return lines.join('\n');
}

function htmlSemanticElementContentToText(html: string) {
  const lines: string[] = [];
  const semanticElementPattern = /<([a-z][\w:-]*)\b([^>]*(?:real_?name|user_?name|student_?name|member_?name|m_?name|name|student_?(?:number|no|id)|std_?(?:number|no|id)|stu_?(?:number|no|id)|hakbun|school_?number|grade|haknyeon|class|ban|number|num|bun|generation|gisu|성명|실명|이름|학번|학생번호|학년|반|번|기수)[^>]*)>([\s\S]*?)<\/\1>/gi;

  for (const match of html.matchAll(semanticElementPattern)) {
    const attributes = parseHtmlAttributes(`<${match[1]} ${match[2]}>`);
    const keyText = [
      attributes.name,
      attributes.id,
      attributes.class,
      attributes.title,
      attributes['aria-label']
    ].filter(Boolean).join(' ').toLowerCase();
    const value = normalizeText(htmlToText(match[3]));
    if (!value || value.length > 80) continue;

    if (/(?:^|\s)(?:real_?name|user_?name|student_?name|member_?name|m_?name|name)|성명|실명|이름/i.test(keyText) && /^[가-힣]{2,5}$/.test(value)) {
      lines.push(`이름 ${value}`);
    }
    if (/(?:student_?(?:number|no|id)|std_?(?:number|no|id)|stu_?(?:number|no|id)|hakbun|school_?number|학번|학생번호)/i.test(keyText) && /^\d{4}$/.test(value)) {
      lines.push(`학번 ${value}`);
    }
    if (/(?:generation|gisu|기수)/i.test(keyText) && /^\d{1,2}$/.test(value)) {
      lines.push(`기수 ${value}기`);
    }
  }

  return lines.join('\n');
}

function parseHtmlAttributes(tag: string): HtmlAttributeMap {
  const attributes: HtmlAttributeMap = {};
  for (const match of tag.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attributes[match[1].toLowerCase()] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function findKoreanName(text: string) {
  const labeledName = text.match(/(?:실명|성명|이름|(?:^|\s)(?:real_?name|user_?name|student_?name|member_?name|m_?name|name))\s*[:：]?\s*([가-힣]{2,5})(?=\s|$|님|학생)/i);
  if (labeledName) return labeledName[1];

  const addressedName = text.match(/([가-힣]{2,5})\s*(?:님|학생)(?:\s|$)/);
  return addressedName?.[1] ?? null;
}

function findStudentNumber(text: string) {
  const explicitStudentNumber = text.match(/(?:학번|학생번호|(?:^|\s)(?:student_?(?:number|no|id)|std_?(?:number|no|id)|stu_?(?:number|no|id)|hakbun|school_?number))\s*[:：]?\s*(\d{4})\b/i);
  if (explicitStudentNumber) return explicitStudentNumber[1];

  const gradeClassNumber = text.match(/([1-3])\s*학년\s*(\d{1,2})\s*반\s*(\d{1,2})\s*번/);
  if (gradeClassNumber) {
    const [, grade, classNumber, number] = gradeClassNumber;
    return `${grade}${classNumber.padStart(1, '0')}${number.padStart(2, '0')}`;
  }

  const compactGradeClassNumber = text.match(/([1-3])\s*-\s*(\d{1,2})\s*-\s*(\d{1,2})/);
  if (compactGradeClassNumber) {
    const [, grade, classNumber, number] = compactGradeClassNumber;
    return `${grade}${classNumber}${number.padStart(2, '0')}`;
  }

  return null;
}

function findGeneration(text: string) {
  const generation = text.match(/(?:기수|generation|gisu)\s*[:：]?\s*(\d{1,2})\s*기?\b/i) ?? text.match(/(\d{1,2})\s*기\b/);
  return generation ? Number(generation[1]) : undefined;
}

function parseRiroIdentityJson(jsonText: string) {
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    return collectIdentityFromJson(parsed).join('\n');
  } catch {
    return '';
  }
}

function collectIdentityFromJson(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];

  if (Array.isArray(value)) return value.flatMap(collectIdentityFromJson);

  const record = value as Record<string, unknown>;
  const lines: string[] = [];
  for (const [key, rawValue] of Object.entries(record)) {
    if (typeof rawValue === 'string' || typeof rawValue === 'number') {
      lines.push(`${key} ${rawValue}`);
    } else {
      lines.push(...collectIdentityFromJson(rawValue));
    }
  }
  return lines;
}

export function parseRiroIdentityFromHtml(htmlDocuments: string[], loginId: string): RiroProfile | null {
  const text = normalizeText(htmlDocuments.map((html) => `${htmlToText(html)}\n${htmlAttributesToText(html)}\n${htmlSemanticElementContentToText(html)}\n${parseRiroIdentityJson(html)}`).join('\n'));
  const realName = findKoreanName(text);
  const studentNumber = findStudentNumber(text);
  if (!realName || !studentNumber) return null;

  return {
    realName,
    studentNumber,
    generation: resolveGeneration({ explicitGeneration: findGeneration(text), loginId, studentNumber }),
    role: normalizeLoginId(loginId).startsWith('admin') ? 'ADMIN' : 'USER'
  };
}

function buildRiroLoginBody({ loginId, password }: RiroAuthInput) {
  const body = new URLSearchParams();
  body.set('app', 'user');
  body.set('mode', 'login');
  body.set('userType', '1');
  body.set('id', loginId.trim());
  body.set('pw', password);
  body.set('deeplink', '');
  body.set('redirect_link', '');
  return body;
}

function getRiroErrorMessage(value: unknown) {
  if (value && typeof value === 'object' && 'msg' in value && typeof value.msg === 'string') {
    return value.msg.replace(/\s+/g, ' ').trim();
  }
  return '리로스쿨 인증에 실패했습니다. 아이디와 비밀번호를 확인해 주세요.';
}

function getRedirectUrl(value: unknown) {
  if (!value || typeof value !== 'object') return '/';
  const data = (value as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return '/';
  const url = (data as { url?: unknown }).url;
  return typeof url === 'string' && url ? url : '/';
}

export const realRiroAuth: RiroAuthAdapter = async ({ loginId, password }) => {
  const normalized = normalizeLoginId(loginId);
  if (!normalized || !password) {
    return { ok: false, message: '리로스쿨 ID와 비밀번호를 입력해 주세요.' };
  }

  const cookies: CookieStore = {};

  try {
    await riroFetch(RIRO_SIGNIN_PATH, {
      method: 'GET',
      headers: { 'user-agent': 'Mozilla/5.0' }
    }, cookies);

    const loginResponse = await riroFetch(RIRO_LOGIN_PATH, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'referer': new URL(RIRO_SIGNIN_PATH, RIRO_BASE_URL).toString(),
        'user-agent': 'Mozilla/5.0',
        'x-requested-with': 'XMLHttpRequest'
      },
      body: buildRiroLoginBody({ loginId, password })
    }, cookies);

    const loginText = await loginResponse.text();
    const loginJson = JSON.parse(loginText) as { code?: string | number; data?: { url?: string } };
    if (String(loginJson.code) !== '000') {
      return { ok: false, message: getRiroErrorMessage(loginJson) };
    }

    const candidatePaths = Array.from(new Set([
      getRedirectUrl(loginJson),
      '/',
      '/user.php?action=modify_form'
    ]));

    const htmlDocuments = [loginText];
    for (const path of candidatePaths) {
      const response = await riroFetch(path, {
        method: 'GET',
        headers: {
          'referer': new URL(RIRO_SIGNIN_PATH, RIRO_BASE_URL).toString(),
          'user-agent': 'Mozilla/5.0'
        }
      }, cookies);
      htmlDocuments.push(await response.text());
    }

    const profile = parseRiroIdentityFromHtml(htmlDocuments, normalized);
    if (profile) return completeProfile(profile, normalized);

    const knownProfile = knownProfiles[normalized];
    if (knownProfile) return completeProfile(knownProfile, normalized);

    return { ok: false, message: '리로스쿨 로그인은 성공했지만 실명/학번을 찾지 못했습니다. 관리자에게 알려 주세요.' };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { ok: false, message: '리로스쿨 로그인 응답을 해석하지 못했습니다.' };
    }
    return { ok: false, message: '리로스쿨 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' };
  }
};

export const riroAuthAdapter: RiroAuthAdapter = process.env.RIRO_AUTH_MODE === 'mock' ? mockRiroAuth : realRiroAuth;
