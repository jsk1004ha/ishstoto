import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Disclaimer } from '@/components/disclaimer';
import { getRanking, getUserProfile } from '@/lib/matches';
import { getCurrentUser } from '@/lib/session';
import { formatDateTime, formatPoints } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function MePage() {
  const current = await getCurrentUser();
  if (!current) redirect('/login');
  const [profile, ranking] = await Promise.all([getUserProfile(current.id), getRanking(current.id)]);
  if (!profile) redirect('/login');

  return (
    <div className="space-y-5 py-4">
      <section className="glass-card p-6">
        <p className="text-sm font-black text-neon-mint">My Arena</p>
        <h1 className="mt-2 text-3xl font-black text-white">{profile.nickname}</h1>
        <p className="mt-2 text-sm text-slate-400">실명·학번은 본인과 관리자 확인용입니다.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Metric title="보유 포인트" value={formatPoints(profile.points)} />
          <Metric title="내 순위" value={ranking.me ? `#${ranking.me.rank}` : '-'} />
          <Metric title="실명" value={profile.realName} />
          <Metric title="학번/기수" value={`${profile.studentNumber} · ${profile.generation}기`} />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="glass-card p-5">
          <h2 className="text-xl font-black text-white">내 예측 내역</h2>
          <div className="mt-4 space-y-3">
            {profile.predictions.map((prediction) => (
              <Link key={prediction.id} href={`/matches/${prediction.matchId}`} className="block rounded-2xl bg-white/5 p-4 transition hover:bg-white/10">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-white">{prediction.match.title}</p>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">{prediction.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{prediction.option.label} · {formatPoints(prediction.points)} · {formatDateTime(prediction.createdAt)}</p>
              </Link>
            ))}
            {profile.predictions.length === 0 ? <p className="text-sm text-slate-400">아직 예측 내역이 없습니다.</p> : null}
          </div>
        </section>

        <section className="glass-card p-5">
          <h2 className="text-xl font-black text-white">포인트 변동 내역</h2>
          <div className="mt-4 space-y-3">
            {profile.ledgers.map((ledger) => (
              <div key={ledger.id} className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-white">{ledger.reason}</p>
                  <p className={ledger.amount >= 0 ? 'font-black text-neon-mint' : 'font-black text-red-200'}>{ledger.amount >= 0 ? '+' : ''}{formatPoints(ledger.amount)}</p>
                </div>
                <p className="mt-1 text-xs text-slate-400">잔액 {formatPoints(ledger.balanceAfter)} · {ledger.match?.title ?? '계정'} · {formatDateTime(ledger.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Disclaimer />
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return <div className="rounded-3xl bg-white/5 p-4"><p className="text-xs text-slate-400">{title}</p><p className="mt-1 font-black text-white">{value}</p></div>;
}
