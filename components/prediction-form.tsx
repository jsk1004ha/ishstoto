'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { POINT_DISCLAIMER, QUICK_BET_POINTS } from '@/lib/constants';
import { formatPoints } from '@/lib/format';
import { ConfettiBurst } from '@/components/confetti-burst';

type OptionPool = {
  id: string;
  label: string;
  color?: string | null;
  points: number;
  participants: number;
  percentage: number;
  odds: number | null;
};

type PredictionFormProps = {
  matchId: string;
  status: string;
  locksAt: string | Date;
  options: OptionPool[];
  totalPoints: number;
  userPoints: number;
  myPrediction?: { optionId: string; points: number } | null;
};

export function PredictionForm({ matchId, status, options, totalPoints, userPoints, myPrediction }: PredictionFormProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState(myPrediction?.optionId ?? options[0]?.id ?? '');
  const [points, setPoints] = useState(Math.min(100, Math.max(10, userPoints)));
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isOpen = status === 'OPEN';
  const selected = options.find((option) => option.id === selectedOption);
  const displayedOptions = options;
  const expected = useMemo(() => {
    if (!selected || points <= 0) return { odds: null, payout: 0 };
    const ownOldPoints = myPrediction?.points ?? 0;
    const oldOptionPoints = myPrediction?.optionId === selected.id ? ownOldPoints : 0;
    const adjustedTotal = Math.max(0, totalPoints - ownOldPoints) + points;
    const adjustedOption = Math.max(0, selected.points - oldOptionPoints) + points;
    const odds = adjustedOption > 0 ? adjustedTotal / adjustedOption : null;
    return { odds, payout: odds ? Math.floor(points * odds) : 0 };
  }, [selected, points, totalPoints, myPrediction]);
  const projectedOptions = useMemo(() => {
    const ownOldPoints = myPrediction?.points ?? 0;
    const adjustedTotal = Math.max(0, totalPoints - ownOldPoints) + points;
    return displayedOptions.map((option) => {
      const oldOptionPoints = myPrediction?.optionId === option.id ? ownOldPoints : 0;
      const addedPoints = selectedOption === option.id ? points : 0;
      const adjustedOption = Math.max(0, option.points - oldOptionPoints) + addedPoints;
      const odds = adjustedOption > 0 ? adjustedTotal / adjustedOption : option.odds;
      return { ...option, projectedOdds: odds };
    });
  }, [displayedOptions, myPrediction, points, selectedOption, totalPoints]);

  async function submitPrediction() {
    setLoading(true);
    setToast(null);
    try {
      const response = await fetch(`/api/matches/${matchId}/predict`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ optionId: selectedOption, points })
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.message ?? '예측에 실패했습니다.');
      setConfirming(false);
      setSuccess(true);
      setToast('예측이 확정되었습니다!');
      setTimeout(() => setSuccess(false), 1400);
      router.refresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : '예측 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass-card p-5">
      <ConfettiBurst show={success} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">예측 참여</h2>
          <p className="mt-1 text-sm text-slate-400">무승부 없이 선택지 중 승리팀 하나를 고르세요.</p>
        </div>
        <div className="rounded-2xl bg-emerald-300/10 px-4 py-2 text-right">
          <p className="text-xs text-slate-400">내 포인트</p>
          <p className="font-black text-emerald-200">{formatPoints(userPoints)}</p>
        </div>
      </div>

      {myPrediction ? (
        <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-300/10 p-3 text-sm text-sky-100">
          이미 {formatPoints(myPrediction.points)}를 예측했습니다. 기본 설정상 마감 전 1회 수정할 수 있습니다.
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        {displayedOptions.map((option) => {
          const selected = selectedOption === option.id;
          return (
            <motion.button
              key={option.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              disabled={!isOpen}
              onClick={() => setSelectedOption(option.id)}
              className={clsx(
                'rounded-2xl border p-4 text-left transition',
                selected ? 'border-sky-300 bg-sky-300/15 shadow-glow' : 'border-white/10 bg-white/5 hover:bg-white/10',
                !isOpen && 'cursor-not-allowed opacity-60'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-black text-white"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: option.color ?? '#38bdf8' }} />{winLabel(option.label)}</span>
                <span className="text-sm font-bold text-neon-orange">{formatOdds(option.odds)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${option.percentage}%`, backgroundColor: option.color ?? '#38bdf8' }} />
              </div>
              <p className="mt-2 text-xs text-slate-400">{formatPoints(option.points)} · {option.participants}명 · {option.percentage.toFixed(1)}%</p>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-navy-950/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black text-white">선택지별 예상 배당</p>
          <p className="text-xs font-bold text-slate-400">선택 금액 반영</p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {projectedOptions.map((option) => (
            <div key={option.id} className={clsx('rounded-2xl border px-3 py-2', option.id === selectedOption ? 'border-orange-300/40 bg-orange-300/10' : 'border-white/10 bg-white/5')}>
              <p className="flex items-center gap-2 text-sm font-black text-white">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: option.color ?? '#38bdf8' }} />
                {winLabel(option.label)}
              </p>
              <p className="mt-1 text-xl font-black text-neon-orange">{formatOdds(option.projectedOdds)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="points">사용 포인트</label>
          <span className="text-lg font-black text-white">{formatPoints(points)}</span>
        </div>
        <input
          id="points"
          type="range"
          min={10}
          max={Math.max(10, userPoints)}
          step={10}
          value={Math.min(points, Math.max(10, userPoints))}
          onChange={(event) => setPoints(Number(event.target.value))}
          className="mt-4 w-full accent-sky-300"
          disabled={!isOpen}
        />
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {QUICK_BET_POINTS.map((value) => (
            <button key={value} type="button" className="secondary-button px-3 py-2 text-xs" disabled={!isOpen} onClick={() => setPoints(Math.min(value, userPoints))}>{value}점</button>
          ))}
          <button type="button" className="secondary-button px-3 py-2 text-xs" disabled={!isOpen} onClick={() => setPoints(userPoints)}>올인</button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-3xl bg-navy-950/70 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-400">예상 배당</p>
          <p className="text-2xl font-black text-neon-orange">{expected.odds ? `x${expected.odds.toFixed(2)}` : '예측 대기'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">예상 수령 포인트</p>
          <p className="text-2xl font-black text-neon-mint">{formatPoints(expected.payout)}</p>
        </div>
      </div>

      {toast ? <p className="mt-4 rounded-2xl bg-white/10 p-3 text-sm text-sky-100">{toast}</p> : null}
      <button disabled={!isOpen || loading || points > userPoints} onClick={() => setConfirming(true)} className="neon-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50">
        {isOpen ? '예측 확정하기' : '예측 마감'}
      </button>

      <AnimatePresence>
        {confirming ? (
          <motion.div className="fixed inset-0 z-[70] grid place-items-end bg-black/70 p-4 backdrop-blur-sm sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card w-full max-w-md p-5" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
              <h3 className="text-xl font-black text-white">예측을 확정할까요?</h3>
              <p className="mt-2 text-sm text-slate-300">{selected ? winLabel(selected.label) : '선택지'}에 {formatPoints(points)}를 사용합니다.</p>
              <div className="mt-4 rounded-2xl border border-orange-300/20 bg-orange-300/10 p-3 text-xs leading-relaxed text-orange-50">
                {POINT_DISCLAIMER}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="secondary-button" type="button" onClick={() => setConfirming(false)} disabled={loading}>취소</button>
                <button className="neon-button" type="button" onClick={submitPrediction} disabled={loading}>{loading ? '처리 중...' : '확정'}</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function formatOdds(odds: number | null) {
  return odds ? `x${odds.toFixed(2)}` : '예측 대기';
}

function winLabel(label: string) {
  return /승$/.test(label) ? label : `${label} 승`;
}
