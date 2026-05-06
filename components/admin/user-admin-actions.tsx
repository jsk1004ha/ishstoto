'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UserAdminActions({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('관리자 수동 조정');
  const [newRole, setNewRole] = useState(role);
  const [message, setMessage] = useState<string | null>(null);

  async function adjust() {
    if (!window.confirm(`${amount}P를 조정할까요?`)) return;
    const response = await fetch(`/api/admin/users/${userId}/points`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amount, reason }) });
    const json = await response.json();
    setMessage(json.ok ? '포인트 조정 완료' : json.message);
    router.refresh();
  }

  async function sanction() {
    if (!window.confirm(`역할을 ${newRole}(으)로 변경할까요?`)) return;
    const response = await fetch(`/api/admin/users/${userId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role: newRole }) });
    const json = await response.json();
    setMessage(json.ok ? '계정 상태 변경 완료' : json.message);
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-2xl bg-white/5 p-3">
      <div className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
        <input className="input-field px-3 py-2 text-sm" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
        <input className="input-field px-3 py-2 text-sm" value={reason} onChange={(event) => setReason(event.target.value)} />
        <button className="secondary-button px-3 py-2 text-xs" type="button" onClick={adjust}>조정</button>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select className="input-field px-3 py-2 text-sm" value={newRole} onChange={(event) => setNewRole(event.target.value)}><option value="USER">USER</option><option value="ADMIN">ADMIN</option><option value="BANNED">BANNED</option></select>
        <button className="danger-button px-3 py-2 text-xs" type="button" onClick={sanction}>권한/제재</button>
      </div>
      {message ? <p className="text-xs text-sky-100">{message}</p> : null}
    </div>
  );
}
