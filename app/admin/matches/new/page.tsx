import { redirect } from 'next/navigation';
import { MatchForm } from '@/components/admin/match-form';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function NewMatchPage() {
  try { await requireAdmin(); } catch { redirect('/login'); }
  return (
    <div className="space-y-5 py-4">
      <div><p className="text-sm font-black text-neon-mint">Create Match</p><h1 className="text-3xl font-black text-white">경기 생성</h1><p className="mt-2 text-sm text-slate-400">종목별 선택지를 유연하게 입력할 수 있습니다.</p></div>
      <MatchForm />
    </div>
  );
}
