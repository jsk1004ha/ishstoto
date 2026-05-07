import Link from 'next/link';
import { Medal, ShieldCheck, Swords, Target, Trophy } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { MatchCard } from '@/components/match-card';
import { Disclaimer } from '@/components/disclaimer';
import { EmptyState } from '@/components/empty-state';
import { getMatchSummaries, getRanking } from '@/lib/matches';
import { getCurrentUser } from '@/lib/session';
import { formatPoints } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  const [matches, ranking] = await Promise.all([getMatchSummaries(user?.id), getRanking(user?.id)]);
  const openMatches = matches.filter((match) => match.status === 'OPEN').length;
  const topThree = ranking.ranking.slice(0, 3);

  return (
    <div className="space-y-6 py-4">
      <section className="grid gap-4 lg:grid-cols-[1.38fr_0.62fr]">
        <div className="glass-card relative overflow-hidden p-6 sm:p-7">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-300 via-emerald-300 to-orange-300" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-black uppercase text-neon-mint"><Swords size={16} /> Interclass Sports Arena</p>
              <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">
                체육대회 승부예측,<br />가상 포인트로 랭킹 경쟁!
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                무승부 없이 선택지별 승리 배당을 확인하고, 교내 이벤트용 가상 포인트로 안전하게 랭킹에 도전하세요.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-3xl border border-white/10 bg-navy-950/65 p-3">
              <BrandMark size="lg" />
              <div className="hidden sm:block">
                <p className="text-xs font-black text-sky-100">OFFICIAL</p>
                <p className="text-sm font-black text-white">ISHS ARENA</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={user ? '/matches' : '/riro-verify'} className="neon-button"><Target className="mr-2" size={18} />예측 참여</Link>
            <Link href="/ranking" className="secondary-button"><Medal className="mr-2" size={18} />랭킹 보기</Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric title="내 포인트" value={user ? formatPoints(user.points) : '로그인 필요'} />
            <Metric title="내 랭킹" value={ranking.me ? `#${ranking.me.rank}` : '-'} />
            <Metric title="오픈 경기" value={`${openMatches}개`} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-sky-200">내 정보</p>
                <p className="mt-2 text-2xl font-black text-white">{user?.nickname ?? '게스트'}</p>
                <p className="mt-1 text-sm text-slate-400">{user ? `${formatPoints(user.points)} 보유` : '로그인하면 포인트와 내 순위가 표시됩니다.'}</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-300/15 text-sky-100"><ShieldCheck size={22} /></div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 text-sky-100"><Trophy size={18} /><p className="font-black">TOP 3</p></div>
            <div className="mt-4 space-y-2">
              {topThree.map((ranker) => (
                <div key={ranker.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-sm">
                  <span className="font-bold text-white">#{ranker.rank} {ranker.nickname}</span>
                  <span className="font-black text-neon-mint">{formatPoints(ranker.points)}</span>
                </div>
              ))}
            </div>
          </div>
          <Disclaimer compact />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black text-neon-orange">Two-side Live Pool</p>
            <h2 className="text-2xl font-black text-white">현재 승부 예측 현황</h2>
            <p className="mt-1 text-sm text-slate-400">각 경기 카드에서 선택지별 배당을 따로 확인할 수 있습니다.</p>
          </div>
          <Link href="/matches" className="secondary-button hidden sm:inline-flex">전체 보기</Link>
        </div>
        {matches.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {matches.slice(0, 6).map((match, index) => <MatchCard key={match.id} match={match} index={index} />)}
          </div>
        ) : (
          <EmptyState title="아직 등록된 경기가 없습니다" description="관리자가 경기를 만들면 예측 현황이 표시됩니다." />
        )}
      </section>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-navy-950/70 p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}
