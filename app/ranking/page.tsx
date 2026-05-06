import { RankingList } from '@/components/ranking-list';
import { getRanking } from '@/lib/matches';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function RankingPage() {
  const user = await getCurrentUser();
  const { ranking, me } = await getRanking(user?.id);
  return (
    <div className="space-y-5 py-4">
      <div className="glass-card p-6">
        <p className="text-sm font-black text-neon-orange">Leaderboard</p>
        <h1 className="mt-2 text-3xl font-black text-white">포인트 랭킹</h1>
        <p className="mt-2 text-sm text-slate-400">닉네임과 현재 보유 포인트 기준으로 표시됩니다. 실명과 학번은 공개하지 않습니다.</p>
      </div>
      <RankingList ranking={ranking.map((user) => ({ id: user.id, rank: user.rank, nickname: user.nickname, points: user.points, participated: user.participated, won: user.won, hitRate: user.hitRate }))} me={me ? { id: me.id, rank: me.rank, nickname: me.nickname, points: me.points, participated: me.participated, won: me.won, hitRate: me.hitRate } : null} />
    </div>
  );
}
