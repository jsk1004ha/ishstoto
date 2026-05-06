'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Crown, Medal, TrendingUp } from 'lucide-react';
import { formatPoints } from '@/lib/format';

type RankingUser = {
  id: string;
  rank: number;
  nickname: string;
  points: number;
  participated: number;
  won: number;
  hitRate: number;
};

function rankStyle(rank: number) {
  if (rank === 1) return 'border-yellow-300/40 bg-yellow-300/15 text-yellow-100 shadow-orange';
  if (rank === 2) return 'border-slate-200/40 bg-slate-200/15 text-slate-100';
  if (rank === 3) return 'border-orange-400/40 bg-orange-400/15 text-orange-100';
  return 'border-white/10 bg-white/[0.06] text-white';
}

export function RankingList({ ranking, me }: { ranking: RankingUser[]; me?: RankingUser | null }) {
  return (
    <div className="space-y-5">
      {me ? (
        <motion.div layout className="glass-card border-sky-300/30 p-4 shadow-glow">
          <p className="text-xs font-bold text-sky-200">내 순위</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-black text-white">#{me.rank} {me.nickname}</p>
              <p className="text-sm text-slate-400">참여 {me.participated}회 · 성공 {me.won}회 · 적중률 {me.hitRate.toFixed(1)}%</p>
            </div>
            <p className="text-xl font-black text-neon-mint">{formatPoints(me.points)}</p>
          </div>
        </motion.div>
      ) : null}

      <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/10 text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="p-4">순위</th>
              <th className="p-4">닉네임</th>
              <th className="p-4">현재 포인트</th>
              <th className="p-4">참여</th>
              <th className="p-4">성공</th>
              <th className="p-4">적중률</th>
              <th className="p-4">흐름</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((user) => (
              <motion.tr layout key={user.id} className="border-t border-white/10">
                <td className="p-4 font-black">#{user.rank}</td>
                <td className="p-4 font-bold">{user.rank <= 3 ? <Medal className="mr-2 inline" size={16} /> : null}{user.nickname}</td>
                <td className="p-4 font-black text-neon-mint">{formatPoints(user.points)}</td>
                <td className="p-4">{user.participated}</td>
                <td className="p-4">{user.won}</td>
                <td className="p-4">{user.hitRate.toFixed(1)}%</td>
                <td className="p-4 text-emerald-200"><TrendingUp size={18} /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {ranking.map((user, index) => (
          <motion.article
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035 }}
            key={user.id}
            className={clsx('rounded-3xl border p-4', rankStyle(user.rank))}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-lg font-black">
                  {user.rank === 1 ? <Crown className="text-yellow-200" /> : `#${user.rank}`}
                </div>
                <div>
                  <p className="font-black">{user.nickname}</p>
                  <p className="text-xs text-slate-300">참여 {user.participated} · 성공 {user.won} · {user.hitRate.toFixed(1)}%</p>
                </div>
              </div>
              <p className="text-right text-lg font-black text-neon-mint">{formatPoints(user.points)}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
