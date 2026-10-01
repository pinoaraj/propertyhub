import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { OnboardingForm } from './onboarding-form';

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <OnboardingForm user={session.user} />;
}
