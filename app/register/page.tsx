import { redirect } from 'next/navigation';
import { RegisterPanel } from '@/components/auth-panels';
import { getSession } from '@/lib/session';

export default async function RegisterPage() {
  const session = await getSession();
  if (!session?.riroVerified || !session.realName || !session.studentNumber || !session.generation) redirect('/riro-verify');
  return <RegisterPanel verified={{ realName: session.realName, studentNumber: session.studentNumber, generation: session.generation }} />;
}
