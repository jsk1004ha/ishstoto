import { describe, expect, it } from 'vitest';
import { mockRiroAuth } from '@/lib/riro/auth-adapter';

describe('mockRiroAuth', () => {
  it('uses the known Riro mock profile instead of deriving identity from the login id', async () => {
    await expect(mockRiroAuth({ loginId: '2510', password: 'test-password' })).resolves.toMatchObject({
      ok: true,
      realName: '김준서',
      studentNumber: '2309',
      generation: 30,
      role: 'USER'
    });
  });

  it('keeps the generic mock fallback for unknown student ids', async () => {
    await expect(mockRiroAuth({ loginId: '2601', password: 'test-password' })).resolves.toMatchObject({
      ok: true,
      realName: '인증학생2601',
      studentNumber: '2601',
      generation: 33,
      role: 'USER'
    });
  });
});
