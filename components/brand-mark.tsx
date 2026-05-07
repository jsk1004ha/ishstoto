import Image from 'next/image';
import clsx from 'clsx';

const sizes = {
  sm: 'h-10 w-10 rounded-2xl',
  md: 'h-12 w-12 rounded-[1.35rem]',
  lg: 'h-20 w-20 rounded-[1.75rem]'
};

export function BrandMark({ size = 'md', className }: { size?: keyof typeof sizes; className?: string }) {
  return (
    <span className={clsx('relative grid shrink-0 place-items-center overflow-hidden border border-white/15 bg-white/10 shadow-glow', sizes[size], className)}>
      <span className="absolute inset-0 bg-gradient-to-br from-sky-300/30 via-white/10 to-emerald-300/25" />
      <Image
        src="/ishs-main-icon.svg"
        alt="ISHS 포인트 승부예측 아이콘"
        width={112}
        height={112}
        priority={size === 'lg'}
        className="relative h-[76%] w-[76%] object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]"
      />
    </span>
  );
}
