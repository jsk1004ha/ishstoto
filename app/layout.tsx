import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { getCurrentUser } from '@/lib/session';
import { POINT_DISCLAIMER } from '@/lib/constants';
import { BottomTabBar } from '@/components/bottom-tabbar';
import { TopNav } from '@/components/top-nav';

export const metadata: Metadata = {
  title: 'ISHS 포인트 승부예측',
  description: '학교 체육대회 전용 가상 포인트 승부예측 랭킹 사이트',
  icons: {
    icon: '/ishs-main-icon.svg'
  }
};

export const viewport: Viewport = {
  themeColor: '#06111f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="ko">
      <body className="bg-arena-radial antialiased">
        <div className="arena-grid fixed inset-0 -z-10 opacity-40" />
        <TopNav user={user} />
        <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-14">
          {children}
        </main>
        <footer className="mx-auto hidden max-w-6xl px-6 pb-8 text-xs leading-relaxed text-slate-400 md:block">
          <div className="glass-card p-4">
            <Link href="/" className="font-bold text-sky-200">ISHS 포인트 승부예측</Link>
            <p className="mt-2">{POINT_DISCLAIMER}</p>
          </div>
        </footer>
        <BottomTabBar />
      </body>
    </html>
  );
}
