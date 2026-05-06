import { z } from 'zod';

const nicknamePattern = /^[가-힣a-zA-Z0-9_.-]+$/;
const bannedNicknameWords = ['관리자', '운영자', 'admin', '씨발', '병신', '개새', 'fuck'];

export const loginIdSchema = z.string().trim().min(3, '아이디는 3자 이상입니다.').max(32);
export const passwordSchema = z.string().min(8, '비밀번호는 8자 이상입니다.').max(80);

export const nicknameSchema = z
  .string()
  .trim()
  .min(2, '닉네임은 2자 이상입니다.')
  .max(12, '닉네임은 12자 이하입니다.')
  .refine((v) => v.trim().length > 0, '공백 닉네임은 사용할 수 없습니다.')
  .refine((v) => nicknamePattern.test(v), '닉네임은 한글, 영문, 숫자, _, ., - 만 사용할 수 있습니다.')
  .refine((v) => !/[_.-]{3,}/.test(v), '특수문자를 과도하게 반복할 수 없습니다.')
  .refine((v) => !bannedNicknameWords.some((word) => v.toLowerCase().includes(word)), '사용할 수 없는 닉네임입니다.');

export const riroVerifySchema = z.object({
  loginId: z.string().trim().min(1),
  password: z.string().min(1)
});

export const registerSchema = z
  .object({
    loginId: loginIdSchema,
    nickname: nicknameSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1)
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호 확인이 일치하지 않습니다.'
  });

export const loginSchema = z.object({
  loginId: loginIdSchema,
  password: z.string().min(1)
});

export const matchOptionSchema = z.object({
  label: z.string().trim().min(1).max(30),
  className: z.string().trim().max(20).optional().nullable(),
  color: z.string().trim().max(20).optional().nullable()
});

const matchBaseSchema = z.object({
  title: z.string().trim().min(2).max(80),
  sportType: z.enum(['SOCCER', 'RELAY', 'TUG_OF_WAR', 'BASKETBALL', 'JUMP_ROPE']),
  description: z.string().trim().max(500).optional().nullable(),
  options: z.array(matchOptionSchema).min(2).max(8),
  startsAt: z.coerce.date(),
  locksAt: z.coerce.date(),
  status: z.enum(['DRAFT', 'OPEN', 'LOCKED']).default('DRAFT')
});

export const createMatchSchema = matchBaseSchema.refine((v) => v.locksAt <= v.startsAt, {
  path: ['locksAt'],
  message: '예측 마감 시간은 경기 시작 시간보다 늦을 수 없습니다.'
});

export const updateMatchSchema = matchBaseSchema.partial().extend({
  resultOptionId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'OPEN', 'LOCKED', 'RESULTED', 'CANCELLED']).optional()
}).refine((v) => !v.startsAt || !v.locksAt || v.locksAt <= v.startsAt, {
  path: ['locksAt'],
  message: '예측 마감 시간은 경기 시작 시간보다 늦을 수 없습니다.'
});

export const predictSchema = z.object({
  optionId: z.string().min(1),
  points: z.coerce.number().int().min(10)
});

export const resultSchema = z.object({
  resultOptionId: z.string().min(1)
});

export const adminAdjustPointsSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().int().min(-100000).max(100000),
  reason: z.string().trim().min(2).max(200)
});
