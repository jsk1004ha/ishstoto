import { redirect } from 'next/navigation';
import { LoginPanel } from '@/components/auth-panels';
import { getCurrentUser } from '@/lib/session';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/');
  return <LoginPanel />;
}
