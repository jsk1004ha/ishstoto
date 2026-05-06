import Link from 'next/link';
import type { getCurrentUser } from '@/lib/session';

type User = Awaited<ReturnType<typeof getCurrentUser>>;

export function TopNav({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-300 to-emerald-300 text-xl shadow-glow">🏟️</span>
          <span>
            <span className="block text-sm font-black tracking-tight text-white sm:text-base">ISHS 포인트 승부예측</span>
            <span className="hidden text-xs text-slate-400 sm:block">교내 오락용 랭킹 포인트</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          <Link className="secondary-button" href="/matches">경기</Link>
          <Link className="secondary-button" href="/ranking">랭킹</Link>
          <Link className="secondary-button" href="/me">내 정보</Link>
          {user?.isAdmin ? <Link className="secondary-button" href="/admin">관리자</Link> : null}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-black text-white">{user.nickname}</p>
                <p className="text-xs text-emerald-200">{user.points.toLocaleString()} P</p>
              </div>
              <form action="/api/auth/logout" method="post">
                <button className="secondary-button px-3 py-2 text-xs" type="submit">로그아웃</button>
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
