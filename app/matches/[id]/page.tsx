import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Clock, Swords, UsersRound } from 'lucide-react';
import { Disclaimer } from '@/components/disclaimer';
import { PredictionForm } from '@/components/prediction-form';
import { SPORT_ICON, SPORT_LABEL, STATUS_LABEL } from '@/lib/constants';
import { formatDateTime, formatFullDateTime, formatPoints } from '@/lib/format';
import { getMatchDetail } from '@/lib/matches';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const match = await getMatchDetail(id, user?.id);
  if (!match) notFound();
  if (!user) redirect('/login');
  const displayedOptions = match.optionPools;

  return (
    <div className="space-y-5 py-4">
      <Link href="/matches" className="inline-flex items-center gap-2 text-sm font-bold text-sky-200"><ArrowLeft size={16} />경기 목록</Link>
      <section className="glass-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-2xl bg-white/10 px-3 py-1 text-2xl">{SPORT_ICON[match.sportType]}</span>
          <span className="status-pill border-sky-300/20 bg-sky-300/15 text-sky-100">{SPORT_LABEL[match.sportType]}</span>
          <span className="status-pill text-slate-200">{STATUS_LABEL[match.status]}</span>
          <span className="status-pill border-orange-300/20 bg-orange-300/10 text-orange-100">무승부 없음</span>
        </div>
        <h1 className="mt-4 text-3xl font-black text-white">{match.title}</h1>
        {match.description ? <p className="mt-2 text-sm leading-relaxed text-slate-300">{match.description}</p> : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Info title="경기 시작" value={formatFullDateTime(match.startsAt)} icon={<Clock size={16} />} />
          <Info title="예측 마감" value={formatFullDateTime(match.locksAt)} icon={<Clock size={16} />} />
          <Info title="총 참여" value={`${match.totalParticipants}명 · ${formatPoints(match.totalPoints)}`} icon={<UsersRound size={16} />} />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="glass-card p-5">
          <h2 className="flex items-center gap-2 text-xl font-black text-white"><Swords size={20} /> 선택지별 배당 현황</h2>
          <p className="mt-1 text-sm text-slate-400">선택지 중 승리팀 하나만 정산합니다.</p>
          <div className="mt-4 space-y-3">
            {displayedOptions.map((option) => (
              <div key={option.id} className="rounded-2xl border border-white/10 bg-navy-950/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-black text-white"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: option.color ?? '#38bdf8' }} />{winLabel(option.label)}</p>
                  <p className="text-xl font-black text-neon-orange">{formatOdds(option.odds)}</p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${option.percentage}%`, backgroundColor: option.color ?? '#38bdf8' }} /></div>
                <p className="mt-2 text-xs text-slate-400">{formatPoints(option.points)} · {option.participants}명 · {option.percentage.toFixed(1)}%</p>
              </div>
            ))}
          </div>
          <Disclaimer compact />
        </section>
        <PredictionForm
          matchId={match.id}
          status={match.status}
          locksAt={match.locksAt}
          options={match.optionPools}
          totalPoints={match.totalPoints}
          userPoints={user.points}
          myPrediction={match.myPrediction ? { optionId: match.myPrediction.optionId, points: match.myPrediction.points } : null}
        />
      </div>

      <section className="glass-card p-5">
        <h2 className="text-xl font-black text-white">최근 예측 현황</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {match.predictions.slice(0, 12).map((prediction) => (
            <div key={prediction.id} className="rounded-2xl bg-white/5 p-3 text-sm">
              <p className="font-bold text-white">{prediction.user.nickname}</p>
              <p className="text-slate-400">{prediction.option.label} · {formatPoints(prediction.points)} · {formatDateTime(prediction.createdAt)}</p>
            </div>
          ))}
          {match.predictions.length === 0 ? <p className="text-sm text-slate-400">아직 예측한 학생이 없습니다.</p> : null}
        </div>
      </section>
    </div>
  );
}

function Info({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="flex items-center gap-2 text-xs text-slate-400">{icon}{title}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}

function formatOdds(odds: number | null) {
  return odds ? `x${odds.toFixed(2)}` : '예측 대기';
}

function winLabel(label: string) {
  return /승$/.test(label) ? label : `${label} 승`;
}
