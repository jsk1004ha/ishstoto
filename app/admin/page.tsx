import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { formatPoints } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  try { await requireAdmin(); } catch { redirect('/login'); }
  const [matchCount, openCount, userCount, pool] = await Promise.all([
    prisma.match.count(),
    prisma.match.count({ where: { status: 'OPEN' } }),
    prisma.user.count({ where: { role: { not: 'BANNED' } } }),
    prisma.prediction.aggregate({ where: { status: { not: 'REFUNDED' } }, _sum: { points: true } })
  ]);
  return (
    <div className="space-y-5 py-4">
      <section className="glass-card p-6">
        <p className="text-sm font-black text-neon-orange">Admin Console</p>
        <h1 className="mt-2 text-3xl font-black text-white">관리자 대시보드</h1>
        <p className="mt-2 text-sm text-slate-400">경기 생성, 결과 입력, 정산, 취소 환불을 관리합니다.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Metric title="전체 경기" value={`${matchCount}개`} />
          <Metric title="오픈 경기" value={`${openCount}개`} />
          <Metric title="사용자" value={`${userCount}명`} />
          <Metric title="총 예측 풀" value={formatPoints(pool._sum.points ?? 0)} />
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link className="neon-button" href="/admin/matches/new">새 경기 생성</Link>
        <Link className="secondary-button" href="/admin/matches">경기 관리</Link>
        <Link className="secondary-button" href="/admin/users">사용자 관리</Link>
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return <div className="rounded-3xl bg-white/5 p-4"><p className="text-xs text-slate-400">{title}</p><p className="mt-1 text-xl font-black text-white">{value}</p></div>;
}
