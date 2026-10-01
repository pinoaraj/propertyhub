import Link from 'next/link';
import { Building2 } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground mt-2">Last updated: October 1, 2026</p>
        </div>

        <div className="bg-card rounded-xl border shadow-xl p-8 space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing or using the Property Management Platform, you agree to be bound by these
              Terms of Service. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Use of the Service</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activity that occurs under your account. You agree to use the service only for
              lawful purposes related to property and maintenance management.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Accounts</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You must provide accurate and complete information when creating an account. Certain
              roles and permissions are assigned by administrators and may require additional
              verification.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Third-Party Integrations</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The service may integrate with third-party providers such as Google Calendar. Your use
              of those integrations is subject to their respective terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Disclaimer</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is a beta release provided &quot;as is&quot; without warranties of any kind. We do
              not guarantee uninterrupted availability and may modify or discontinue features at any
              time.
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
