import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronDown, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import type { getCurrentUser } from '@/lib/session';

type User = Awaited<ReturnType<typeof getCurrentUser>>;

export function TopNav({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/85 shadow-[0_18px_55px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <BrandMark size="sm" />
          <span>
            <span className="block truncate text-sm font-black text-white sm:text-base">ISHS 포인트 승부예측</span>
            <span className="hidden text-xs text-slate-400 sm:block">무승부 없는 교내 승부 예측</span>
          </span>
        </Link>
        <nav className="hidden items-center rounded-2xl border border-white/10 bg-white/[0.045] p-1 md:flex">
          <NavLink href="/matches">경기</NavLink>
          <NavLink href="/ranking">랭킹</NavLink>
          <NavLink href="/me">내 정보</NavLink>
          {user?.isAdmin ? <NavLink href="/admin">관리자</NavLink> : null}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <Link
                href="/me"
                className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-2.5 py-2 transition hover:border-sky-300/30 hover:bg-white/15"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-300/30 to-emerald-300/25 text-white">
                  <UserRound size={18} />
                </span>
                <span className="hidden text-left sm:block">
                  <span className="flex items-center gap-1 text-[11px] font-black text-sky-100">
                    내 정보
                    {user.isAdmin ? <ShieldCheck size={12} className="text-neon-mint" /> : null}
                  </span>
                  <span className="block max-w-28 truncate text-sm font-black text-white">{user.nickname}</span>
                </span>
                <ChevronDown size={14} className="hidden text-slate-400 transition group-hover:text-white sm:block" />
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="secondary-button px-3 py-2 text-xs" type="submit">
                  <LogOut className="sm:mr-1" size={14} />
                  <span className="hidden sm:inline">로그아웃</span>
                </button>
              </form>
            </>
          ) : (
            <Link className="neon-button px-4 py-2 text-xs" href="/login">로그인</Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="rounded-xl px-4 py-2 text-sm font-black text-slate-300 transition hover:bg-white/10 hover:text-white" href={href}>
      {children}
    </Link>
  );
}
