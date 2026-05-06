import { redirect } from 'next/navigation';
import { UserAdminActions } from '@/components/admin/user-admin-actions';
import { formatDateTime, formatPoints } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  try { await requireAdmin(); } catch { redirect('/login'); }
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, loginId: true, nickname: true, realName: true, studentNumber: true, role: true, points: true, createdAt: true } });
  return (
    <div className="space-y-5 py-4">
      <div><p className="text-sm font-black text-neon-orange">Admin Users</p><h1 className="text-3xl font-black text-white">사용자 관리</h1><p className="mt-2 text-sm text-slate-400">포인트 수동 조정과 계정 제재는 감사 로그에 남습니다.</p></div>
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="glass-card p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
              <div><p className="font-black text-white">{user.nickname} <span className="text-xs text-slate-400">({user.loginId})</span></p><p className="mt-1 text-sm text-slate-400">{user.realName} · {user.studentNumber} · {user.role} · {formatDateTime(user.createdAt)}</p><p className="mt-2 text-lg font-black text-neon-mint">{formatPoints(user.points)}</p></div>
              <UserAdminActions userId={user.id} role={user.role} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
