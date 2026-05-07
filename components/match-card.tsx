'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Clock, Swords, UsersRound, Zap } from 'lucide-react';
import { SPORT_ICON, SPORT_LABEL, STATUS_LABEL } from '@/lib/constants';
import { formatDateTime, formatPoints } from '@/lib/format';

type OptionPool = {
  id: string;
  label: string;
  color?: string | null;
  points: number;
  participants: number;
  percentage: number;
  odds: number | null;
};

type MatchSummary = {
  id: string;
  title: string;
  sportType: string;
  description?: string | null;
  status: string;
  startsAt: string | Date;
  locksAt: string | Date;
  totalPoints: number;
  totalParticipants: number;
  options: OptionPool[];
  myPrediction?: { optionId: string; points: number } | null;
};

export function MatchCard({ match, index = 0 }: { match: MatchSummary; index?: number }) {
  const isOpen = match.status === 'OPEN';
  const selectedLabel = match.options.find((option) => option.id === match.myPrediction?.optionId)?.label;
  const displayedOptions = match.options;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.045, duration: 0.42 }}
      className={clsx('glass-card overflow-hidden p-5', isOpen ? 'border-sky-300/30 shadow-glow' : 'border-white/10')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-2xl bg-white/10 px-3 py-1 text-lg">{SPORT_ICON[match.sportType]}</span>
            <span className="status-pill text-sky-100">
              {SPORT_LABEL[match.sportType] ?? match.sportType}
            </span>
            <span className={clsx('status-pill', isOpen ? 'border-emerald-300/20 bg-emerald-300/15 text-emerald-200' : 'text-slate-300')}>
              {STATUS_LABEL[match.status] ?? match.status}
            </span>
            <span className="status-pill border-orange-300/20 bg-orange-300/10 text-orange-100">무승부 없음</span>
          </div>
          <h2 className="mt-3 text-xl font-black text-white">{match.title}</h2>
          {match.description ? <p className="mt-1 line-clamp-2 text-sm text-slate-400">{match.description}</p> : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-navy-950/70 px-3 py-2 text-right">
          <p className="text-xs text-slate-400">총 풀</p>
          <p className="text-lg font-black text-neon-mint">{formatPoints(match.totalPoints)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
        <div className="flex items-center gap-2"><Clock size={14} /> 시작 {formatDateTime(match.startsAt)}</div>
        <div className="flex items-center gap-2"><Zap size={14} /> 마감 {formatDateTime(match.locksAt)}</div>
        <div className="flex items-center gap-2"><UsersRound size={14} /> 참여 {match.totalParticipants.toLocaleString()}명</div>
        {selectedLabel ? <div className="font-bold text-orange-200">내 선택: {selectedLabel} · {formatPoints(match.myPrediction?.points ?? 0)}</div> : null}
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-navy-950/55 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-black text-white"><Swords size={16} /> 선택지별 배당</p>
          <p className="text-xs font-bold text-slate-400">승리팀 하나만 선택</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {displayedOptions.map((option) => {
            const selected = option.id === match.myPrediction?.optionId;
            return (
              <motion.div
                key={option.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={clsx('rounded-2xl border p-3', selected ? 'border-orange-300/40 bg-orange-300/10' : 'border-white/10 bg-white/[0.055]')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex min-w-0 items-center gap-2 font-black text-white">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: option.color ?? '#38bdf8' }} />
                      <span className="truncate">{winLabel(option.label)}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{formatPoints(option.points)} · {option.participants}명</p>
                  </div>
                  <motion.p key={`${option.id}-${option.odds}`} initial={{ scale: 1.12 }} animate={{ scale: 1 }} className="text-lg font-black text-neon-orange">
                    {formatOdds(option.odds)}
                  </motion.p>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${option.color ?? '#38bdf8'}, rgba(255,255,255,0.82))` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${option.percentage}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
                <p className="mt-2 text-right text-xs font-bold text-slate-400">{option.percentage.toFixed(1)}%</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Link className={isOpen ? 'neon-button flex-1' : 'secondary-button flex-1'} href={`/matches/${match.id}`}>
          {isOpen ? '예측하기' : '상세 보기'}
        </Link>
        <Link className="secondary-button" href="/ranking">랭킹</Link>
      </div>
    </motion.article>
  );
}

function formatOdds(odds: number | null) {
  return odds ? `x${odds.toFixed(2)}` : '대기';
}

function winLabel(label: string) {
  return /승$/.test(label) ? label : `${label} 승`;
}
