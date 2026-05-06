'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Disclaimer } from '@/components/disclaimer';

type FormState = { loading: boolean; message: string | null };

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const json = await response.json();
  if (!response.ok || !json.ok) throw new Error(json.message ?? '요청에 실패했습니다.');
  return json.data;
}

export function LoginPanel() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ loading: false, message: null });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true, message: null });
    try {
      await postJson('/api/auth/login', { loginId: form.get('loginId'), password: form.get('password') });
      router.push('/');
      router.refresh();
    } catch (error) {
      setState({ loading: false, message: error instanceof Error ? error.message : '로그인 실패' });
    }
  }

  return (
    <AuthShell title="로그인" description="가입한 아이디로 체육대회 예측 대시보드에 입장하세요.">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block"><span className="label">아이디</span><input name="loginId" className="input-field mt-2" autoComplete="username" required /></label>
        <label className="block"><span className="label">비밀번호</span><input name="password" type="password" className="input-field mt-2" autoComplete="current-password" required /></label>
        {state.message ? <p className="rounded-2xl bg-red-500/15 p-3 text-sm text-red-100">{state.message}</p> : null}
        <button className="neon-button w-full" disabled={state.loading}>{state.loading ? '로그인 중...' : '로그인'}</button>
        <button type="button" className="secondary-button w-full" onClick={() => router.push('/riro-verify')}>리로스쿨 인증 후 회원가입</button>
      </form>
    </AuthShell>
  );
}

export function RiroVerifyPanel() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ loading: false, message: null });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true, message: null });
    try {
      await postJson('/api/auth/riro/verify', { loginId: form.get('loginId'), password: form.get('password') });
      router.push('/register');
      router.refresh();
    } catch (error) {
      setState({ loading: false, message: error instanceof Error ? error.message : '인증 실패' });
    }
  }

  return (
    <AuthShell title="리로스쿨 본인인증" description="ID/PW는 저장하지 않으며, 실제 배포 시 어댑터만 교체할 수 있습니다.">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block"><span className="label">리로스쿨 ID</span><input name="loginId" className="input-field mt-2" autoComplete="username" required /></label>
        <label className="block"><span className="label">리로스쿨 비밀번호</span><input name="password" type="password" className="input-field mt-2" autoComplete="current-password" required /></label>
        {state.message ? <p className="rounded-2xl bg-red-500/15 p-3 text-sm text-red-100">{state.message}</p> : null}
        <button className="neon-button w-full" disabled={state.loading}>{state.loading ? '인증 중...' : '본인인증'}</button>
      </form>
      <p className="mt-4 text-xs text-slate-400">Mock 인증: 아무 ID와 4자 이상 비밀번호로 통과합니다. admin으로 시작하는 ID는 관리자 권한입니다.</p>
    </AuthShell>
  );
}

export function RegisterPanel({ verified }: { verified: { realName: string; studentNumber: string; generation: number } }) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ loading: false, message: null });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true, message: null });
    try {
      await postJson('/api/auth/register', {
        loginId: form.get('loginId'),
        nickname: form.get('nickname'),
        password: form.get('password'),
        passwordConfirm: form.get('passwordConfirm')
      });
      router.push('/');
      router.refresh();
    } catch (error) {
      setState({ loading: false, message: error instanceof Error ? error.message : '가입 실패' });
    }
  }

  return (
    <AuthShell title="계정 만들기" description="공개 닉네임과 로그인 정보를 설정하세요. 실명/학번은 관리자 확인용으로만 저장됩니다.">
      <div className="mb-5 grid gap-3 rounded-3xl bg-white/5 p-4 text-sm sm:grid-cols-3">
        <ReadOnly label="실명" value={verified.realName} />
        <ReadOnly label="학번" value={verified.studentNumber} />
        <ReadOnly label="기수" value={`${verified.generation}기`} />
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block"><span className="label">닉네임</span><input name="nickname" className="input-field mt-2" minLength={2} maxLength={12} required placeholder="랭킹에 표시될 이름" /></label>
        <label className="block"><span className="label">아이디</span><input name="loginId" className="input-field mt-2" autoComplete="username" required /></label>
        <label className="block"><span className="label">비밀번호</span><input name="password" type="password" className="input-field mt-2" autoComplete="new-password" minLength={8} required /></label>
        <label className="block"><span className="label">비밀번호 확인</span><input name="passwordConfirm" type="password" className="input-field mt-2" autoComplete="new-password" minLength={8} required /></label>
        <Disclaimer />
        {state.message ? <p className="rounded-2xl bg-red-500/15 p-3 text-sm text-red-100">{state.message}</p> : null}
        <button className="neon-button w-full" disabled={state.loading}>{state.loading ? '가입 중...' : '가입하고 1000P 받기'}</button>
      </form>
    </AuthShell>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-400">{label}</p><p className="font-black text-white">{value}</p></div>;
}

function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-5xl place-items-center py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid w-full gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-card p-6">
          <p className="text-sm font-black text-neon-mint">School Sports Day</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{description}</p>
          <div className="mt-8 rounded-3xl bg-gradient-to-br from-sky-400/20 to-emerald-300/10 p-5">
            <p className="text-5xl">🏆</p>
            <p className="mt-4 font-black text-white">포인트는 랭킹용 가상 점수입니다.</p>
            <p className="mt-2 text-sm text-slate-300">현금·현물·상품권·외부 재화와 연결되는 기능은 없습니다.</p>
          </div>
        </div>
        <div className="glass-card p-6">{children}</div>
      </motion.div>
    </div>
  );
}
