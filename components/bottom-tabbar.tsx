'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Medal, Trophy, UserRound } from 'lucide-react';
import clsx from 'clsx';

const tabs = [
  { href: '/', label: '홈', icon: Home },
  { href: '/matches', label: '경기', icon: Trophy },
  { href: '/ranking', label: '랭킹', icon: Medal },
  { href: '/me', label: '내 정보', icon: UserRound }
];

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-navy-950/92 px-3 pb-[calc(0.5rem+var(--safe-bottom))] pt-2 shadow-[0_-18px_55px_rgba(0,0,0,0.36)] backdrop-blur-2xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border text-xs font-bold transition',
                active ? 'border-sky-300/30 bg-sky-300/15 text-sky-100 shadow-glow' : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
