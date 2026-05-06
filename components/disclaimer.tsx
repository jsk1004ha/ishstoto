import { POINT_DISCLAIMER } from '@/lib/constants';

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-orange-300/20 bg-orange-300/10 p-4 text-sm leading-relaxed text-orange-50">
      <p className="font-black text-orange-200">금전 가치 없음 안내</p>
      <p className={compact ? 'mt-1 text-xs' : 'mt-2'}>{POINT_DISCLAIMER}</p>
    </div>
  );
}
