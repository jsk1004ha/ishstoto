'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminActions({ matchId, options, settledAt }: { matchId: string; options: { id: string; label: string }[]; settledAt?: string | Date | null }) {
  const router = useRouter();
  const [resultOptionId, setResultOptionId] = useState(options[0]?.id ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function call(action: 'result' | 'settle' | 'cancel') {
    const warning = action === 'result'
      ? '결과 선택지를 저장할까요? 정산 전까지는 수정 가능하지만 신중히 확인하세요.'
      : action === 'settle'
        ? '정산을 실행하면 사용자 포인트가 지급되며 되돌리기 어렵습니다. 계속할까요?'
        : '경기를 취소하고 ACTIVE 예측을 모두 환불할까요?';
    if (!window.confirm(warning)) return;
    setLoading(action);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/matches/${matchId}/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: action === 'result' ? JSON.stringify({ resultOptionId }) : '{}'
      });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.message ?? '처리 실패');
      setMessage(action === 'settle' ? `정산 완료: ${json.data.paidUsers}명 / ${json.data.totalPaid}P 지급` : '처리되었습니다.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="glass-card space-y-4 p-5">
      <div>
        <h2 className="text-xl font-black text-white">결과·정산</h2>
        <p className="mt-1 text-sm text-orange-100">결과 입력과 정산은 서버 트랜잭션으로 처리됩니다. 정산 완료 후에는 변경이 어렵습니다.</p>
      </div>
      <label className="block"><span className="label">정답 선택지</span><select className="input-field mt-2" value={resultOptionId} onChange={(event) => setResultOptionId(event.target.value)} disabled={Boolean(settledAt)}>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
      <div className="grid gap-2 sm:grid-cols-3">
        <button className="secondary-button" type="button" onClick={() => call('result')} disabled={Boolean(settledAt) || loading !== null}>{loading === 'result' ? '저장 중...' : '결과 입력'}</button>
        <button className="neon-button" type="button" onClick={() => call('settle')} disabled={loading !== null}>{loading === 'settle' ? '정산 중...' : '정산 실행'}</button>
        <button className="danger-button" type="button" onClick={() => call('cancel')} disabled={Boolean(settledAt) || loading !== null}>{loading === 'cancel' ? '환불 중...' : '취소·환불'}</button>
      </div>
      {message ? <p className="rounded-2xl bg-white/10 p-3 text-sm text-sky-100">{message}</p> : null}
    </div>
  );
}
