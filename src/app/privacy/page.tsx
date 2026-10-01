import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: October 1, 2026</p>
        </div>

        <div className="bg-card rounded-xl border shadow-xl p-8 space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We collect the information you provide directly, including your name, email address, and
              account preferences. When you connect a calendar provider, we store the OAuth tokens
              required to access that calendar on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use your information to provide and maintain the service, manage properties, tickets,
              and schedules, and communicate with you about your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Data Storage</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your data is stored securely and transmitted over encrypted connections. OAuth tokens
              are stored encrypted and are only used to access the calendar services you explicitly
              connect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Third-Party Services</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may use third-party services for authentication and calendar integrations. These
              providers have their own privacy policies governing how they handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For privacy questions or data requests, contact the platform administrator.
            </p>
          </section>

          <div className="pt-2 text-center">
            <Link href="/login" className="text-sm text-primary font-medium hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
