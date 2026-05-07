import { MatchCard } from '@/components/match-card';
import { EmptyState } from '@/components/empty-state';
import { getMatchSummaries } from '@/lib/matches';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function MatchesPage() {
  const user = await getCurrentUser();
  const matches = await getMatchSummaries(user?.id);
  return (
    <div className="space-y-5 py-4">
      <div>
        <p className="text-sm font-black text-neon-mint">Matches</p>
        <h1 className="text-3xl font-black text-white">경기 전체 목록</h1>
        <p className="mt-2 text-sm text-slate-400">무승부 없이 각 선택지의 배당과 참여 현황을 한눈에 확인하세요.</p>
      </div>
      {matches.length > 0 ? <div className="grid gap-4 lg:grid-cols-2">{matches.map((match, index) => <MatchCard key={match.id} match={match} index={index} />)}</div> : <EmptyState title="경기가 없습니다" description="관리자 경기 생성 후 다시 확인해 주세요." />}
    </div>
  );
}
