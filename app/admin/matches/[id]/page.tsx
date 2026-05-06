import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AdminActions } from '@/components/admin/admin-actions';
import { MatchForm } from '@/components/admin/match-form';
import { computePools } from '@/lib/betting';
import { formatDateTime, formatPoints } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AdminMatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { redirect('/login'); }
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      options: { orderBy: { sortOrder: 'asc' } },
      predictions: { include: { user: { select: { nickname: true, realName: true, studentNumber: true } }, option: true }, orderBy: { createdAt: 'desc' } },
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 10, include: { actor: { select: { nickname: true } } } }
    }
  });
  if (!match) notFound();
  const pools = computePools(match.options, match.predictions);

  return (
    <div className="space-y-5 py-4">
      <Link href="/admin/matches" className="text-sm font-bold text-sky-200">← 경기 관리</Link>
      <section className="glass-card p-5">
        <h1 className="text-3xl font-black text-white">{match.title}</h1>
        <p className="mt-2 text-sm text-slate-400">총 {formatPoints(pools.totalPoints)} · 참여 {pools.totalParticipants}명 · 정산 {match.settledAt ? formatDateTime(match.settledAt) : '미완료'}</p>
      </section>
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <MatchForm initial={{
          id: match.id,
          title: match.title,
          sportType: match.sportType,
          description: match.description,
          startsAt: match.startsAt,
          locksAt: match.locksAt,
          status: match.status,
          options: match.options.map((option) => ({ label: option.label, className: option.className ?? undefined, color: option.color ?? undefined }))
        }} />
        <AdminActions matchId={match.id} options={match.options} settledAt={match.settledAt} />
      </div>
      <section className="glass-card p-5">
        <h2 className="text-xl font-black text-white">선택지 풀</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pools.optionPools.map((option) => <div key={option.id} className="rounded-2xl bg-white/5 p-4"><p className="font-black text-white">{option.label}</p><p className="text-sm text-slate-400">{formatPoints(option.points)} · {option.participants}명 · {option.odds ? `x${option.odds.toFixed(2)}` : '대기'}</p></div>)}
        </div>
      </section>
      <section className="glass-card p-5">
        <h2 className="text-xl font-black text-white">전체 예측 내역</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-slate-400"><tr><th className="p-2">닉네임</th><th className="p-2">실명</th><th className="p-2">학번</th><th className="p-2">선택</th><th className="p-2">포인트</th><th className="p-2">상태</th><th className="p-2">시간</th></tr></thead>
            <tbody>{match.predictions.map((prediction) => <tr key={prediction.id} className="border-t border-white/10"><td className="p-2 font-bold text-white">{prediction.user.nickname}</td><td className="p-2">{prediction.user.realName}</td><td className="p-2">{prediction.user.studentNumber}</td><td className="p-2">{prediction.option.label}</td><td className="p-2">{formatPoints(prediction.points)}</td><td className="p-2">{prediction.status}</td><td className="p-2">{formatDateTime(prediction.createdAt)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="glass-card p-5">
        <h2 className="text-xl font-black text-white">감사 로그</h2>
        <div className="mt-4 space-y-2">{match.auditLogs.map((log) => <div key={log.id} className="rounded-2xl bg-white/5 p-3 text-sm"><span className="font-bold text-white">{log.action}</span><span className="ml-2 text-slate-400">{log.actor?.nickname ?? 'system'} · {formatDateTime(log.createdAt)}</span></div>)}</div>
      </section>
    </div>
  );
}
