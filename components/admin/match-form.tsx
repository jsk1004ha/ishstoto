'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OPTION_COLORS, SPORT_LABEL } from '@/lib/constants';

type OptionInput = { label: string; className?: string; color?: string };
type MatchFormInitial = {
  id?: string;
  title?: string;
  sportType?: string;
  description?: string | null;
  startsAt?: string | Date;
  locksAt?: string | Date;
  status?: string;
  options?: OptionInput[];
};

const sportTypes = ['SOCCER', 'RELAY', 'TUG_OF_WAR', 'BASKETBALL', 'DODGEBALL', 'JUMP_ROPE'] as const;
const defaultOptionLabels: Record<string, string[]> = {
  RELAY: ['1반', '2반', '3반', '4반'],
  JUMP_ROPE: ['1반', '2반', '3반', '4반']
};

function defaultOptionsForSport(sportType: string) {
  return (defaultOptionLabels[sportType] ?? ['1반', '2반']).map((label, index) => ({ label, color: OPTION_COLORS[index % OPTION_COLORS.length] }));
}

function localDateTime(value?: string | Date) {
  const date = value ? new Date(value) : new Date(Date.now() + 1000 * 60 * 60 * 24);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function MatchForm({ initial }: { initial?: MatchFormInitial }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sportType, setSportType] = useState(initial?.sportType ?? 'SOCCER');
  const defaultOptions = useMemo(() => {
    if (initial?.options?.length) return initial.options;
    return defaultOptionsForSport(initial?.sportType ?? 'SOCCER');
  }, [initial]);
  const [options, setOptions] = useState<OptionInput[]>(defaultOptions);

  function setOption(index: number, patch: Partial<OptionInput>) {
    setOptions((current) => current.map((option, i) => i === index ? { ...option, ...patch } : option));
  }

  function changeSportType(nextSportType: string) {
    setSportType(nextSportType);
    setOptions(defaultOptionsForSport(nextSportType));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get('title'),
      sportType,
      description: form.get('description'),
      startsAt: form.get('startsAt'),
      locksAt: form.get('locksAt'),
      status: form.get('status'),
      options: options.filter((option) => option.label.trim()).map((option) => ({ ...option, label: option.label.trim() }))
    };
    try {
      const response = await fetch(initial?.id ? `/api/admin/matches/${initial.id}` : '/api/admin/matches', {
        method: initial?.id ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.message ?? '저장 실패');
      router.push(`/admin/matches/${json.data.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass-card space-y-5 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="label">종목</span><select className="input-field mt-2" value={sportType} onChange={(event) => changeSportType(event.target.value)}>{sportTypes.map((sport) => <option key={sport} value={sport}>{SPORT_LABEL[sport]}</option>)}</select></label>
        <label className="block"><span className="label">상태</span><select name="status" className="input-field mt-2" defaultValue={initial?.status ?? 'DRAFT'}><option value="DRAFT">준비중</option><option value="OPEN">예측 오픈</option><option value="LOCKED">마감</option></select></label>
      </div>
      <label className="block"><span className="label">경기명</span><input name="title" className="input-field mt-2" defaultValue={initial?.title} required /></label>
      <label className="block"><span className="label">설명</span><textarea name="description" className="input-field mt-2 min-h-24" defaultValue={initial?.description ?? ''} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="label">경기 시작 시간</span><input name="startsAt" type="datetime-local" className="input-field mt-2" defaultValue={localDateTime(initial?.startsAt)} required /></label>
        <label className="block"><span className="label">예측 마감 시간</span><input name="locksAt" type="datetime-local" className="input-field mt-2" defaultValue={localDateTime(initial?.locksAt)} required /></label>
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="label">참가 선택지</p>
          <button className="secondary-button px-3 py-2 text-xs" type="button" onClick={() => setOptions((current) => [...current, { label: '', color: OPTION_COLORS[current.length % OPTION_COLORS.length] }])} disabled={options.length >= 8}>선택지 추가</button>
        </div>
        <div className="mt-3 space-y-2">
          {options.map((option, index) => (
            <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2">
              <input className="input-field" value={option.label} onChange={(event) => setOption(index, { label: event.target.value })} placeholder={`${index + 1}번 선택지`} />
              <input className="h-full w-14 rounded-2xl border border-white/10 bg-navy-950 p-1" type="color" value={option.color ?? OPTION_COLORS[index % OPTION_COLORS.length]} onChange={(event) => setOption(index, { color: event.target.value })} />
              <button className="secondary-button px-3" type="button" onClick={() => setOptions((current) => current.filter((_, i) => i !== index))} disabled={options.length <= 2}>삭제</button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">각 경기는 선택지 중 승리팀 하나만 정산합니다. 무승부 선택지는 만들지 않습니다.</p>
      </div>
      {message ? <p className="rounded-2xl bg-red-500/15 p-3 text-sm text-red-100">{message}</p> : null}
      <button className="neon-button w-full" disabled={loading}>{loading ? '저장 중...' : '경기 저장'}</button>
    </form>
  );
}
