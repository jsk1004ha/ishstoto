import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { computePools } from '@/lib/betting';
import { SPORT_ICON, SPORT_LABEL, STATUS_LABEL } from '@/lib/constants';
import { formatDateTime, formatPoints } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminMatchesPage() {
  try { await requireAdmin(); } catch { redirect('/login'); }
  const matches = await prisma.match.findMany({
    orderBy: { startsAt: 'asc' },
    include: { options: true, predictions: { where: { status: { not: 'REFUNDED' } }, select: { userId: true, optionId: true, points: true, status: true } } }
  });
  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-sm font-black text-neon-mint">Admin Matches</p><h1 className="text-3xl font-black text-white">경기 관리</h1></div>
        <Link href="/admin/matches/new" className="neon-button">새 경기</Link>
      </div>
      <div className="space-y-3">
        {matches.map((match) => {
          const pools = computePools(match.options, match.predictions);
          return (
            <Link key={match.id} href={`/admin/matches/${match.id}`} className="glass-card block p-4 transition hover:bg-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-black text-white">{SPORT_ICON[match.sportType]} {match.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{SPORT_LABEL[match.sportType]} · {formatDateTime(match.startsAt)} · {STATUS_LABEL[match.status]}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-80">
                  <AdminMetric title="총 포인트" value={formatPoints(pools.totalPoints)} />
                  <AdminMetric title="참여자" value={`${pools.totalParticipants}명`} />
                  <AdminMetric title="결과" value={match.resultOptionId ? '입력됨' : '미입력'} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function AdminMetric({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl bg-white/5 p-3"><p className="text-slate-400">{title}</p><p className="font-black text-white">{value}</p></div>;
}
