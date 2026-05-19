import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Clinch",
  description: "How Clinch collects, uses, and protects your data.",
};

const LAST_UPDATED = "May 19, 2025";
const CONTACT_EMAIL = "hello@useclinch.com";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      {/* Header */}
      <div className="mb-12">
        <p className="text-[13px] font-[500] uppercase tracking-widest text-[#62666d]">
          Legal
        </p>
        <h1 className="mt-3 text-[36px] font-[600] tracking-[-0.03em] text-white">
          Privacy Policy
        </h1>
        <p className="mt-3 text-[15px] text-[#62666d]">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <div className="prose prose-invert prose-sm max-w-none space-y-10 text-[15px] leading-relaxed text-[#8a8f98]">

        {/* Intro */}
        <section>
          <p>
            Clinch (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the Clinch platform available
            at <strong className="text-white">useclinch.com</strong>. This Privacy Policy explains what
            information we collect, how we use it, and what rights you have in relation
            to it. By using Clinch, you agree to the collection and use of information
            in accordance with this policy.
          </p>
        </section>

        {/* 1 */}
        <Section title="1. Information We Collect">
          <Subsection title="Account Information">
            When you create an account, we collect your name, email address, and
            password (stored as a secure hash). If you sign up via Google OAuth, we
            receive your name and email from Google.
          </Subsection>
          <Subsection title="Profile Data">
            To generate proposals, you may optionally provide: a professional bio,
            a list of services you offer, past project descriptions, and a portfolio
            URL. This data is stored in your account and used solely to personalise
            your AI-generated proposals.
          </Subsection>
          <Subsection title="Proposal and Invoice Content">
            We store the proposals and invoices you create, including job descriptions
            you paste, client names, client email addresses, project details, and
            pricing information. This content is private to your account.
          </Subsection>
          <Subsection title="Usage Data">
            We collect standard server logs including IP addresses, browser type,
            pages visited, and timestamps. We use this to maintain service reliability
            and diagnose errors.
          </Subsection>
          <Subsection title="Payment Information">
            If you upgrade to Pro, payments are processed by Stripe. We do not store
            your full card number, CVV, or billing address. Stripe provides us with a
            tokenised representation of your payment method and your subscription
            status.
          </Subsection>
        </Section>

        {/* 2 */}
        <Section title="2. How We Use Your Information">
          <ul className="list-disc space-y-2 pl-5">
            <li>To create and manage your account</li>
            <li>To generate AI-powered proposals using your profile and job description input</li>
            <li>To send transactional emails (invoice notifications, password reset, proposal updates)</li>
            <li>To enforce usage limits based on your subscription tier</li>
            <li>To detect and prevent fraud or abuse</li>
            <li>To improve the product through aggregated, anonymised analytics</li>
          </ul>
          <p className="mt-4">
            We do <strong className="text-white">not</strong> sell your personal data to third parties.
            We do <strong className="text-white">not</strong> use your data for advertising purposes.
          </p>
        </Section>

        {/* 3 */}
        <Section title="3. AI Processing (OpenAI)">
          <p>
            Clinch uses the OpenAI API to generate proposal content. When you generate
            a proposal, the following data is sent to OpenAI:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>The job description you paste or enter</li>
            <li>Your professional bio, services, and past project descriptions</li>
            <li>The pricing mode, currency, and budget/rate you provide for that proposal</li>
          </ul>
          <p className="mt-4">
            OpenAI processes this data to return a JSON proposal. As of March 2023,
            OpenAI&apos;s API does not use data submitted via the API to train its models.
            You can review OpenAI&apos;s data usage policies at{" "}
            <a
              href="https://openai.com/policies/api-data-usage-policies"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-2 hover:text-[#e8a338] transition-colors"
            >
              openai.com/policies
            </a>
            .
          </p>
        </Section>

        {/* 4 */}
        <Section title="4. Data Storage and Security">
          <p>
            Your data is stored in Supabase (PostgreSQL), hosted on AWS infrastructure
            in the United States. Data in transit is encrypted with TLS. Data at rest
            is encrypted by Supabase&apos;s default storage encryption.
          </p>
          <p className="mt-3">
            We take reasonable technical and organisational measures to protect your
            data. However, no method of transmission over the internet is 100% secure,
            and we cannot guarantee absolute security.
          </p>
        </Section>

        {/* 5 */}
        <Section title="5. Third-Party Services">
          <p>We use the following third-party services to operate Clinch:</p>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.06]">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-2.5 text-left font-[500] text-white">Service</th>
                  <th className="px-4 py-2.5 text-left font-[500] text-white">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Supabase", "Database, authentication, file storage"],
                  ["OpenAI", "AI proposal generation"],
                  ["Stripe", "Payment processing (Pro subscriptions)"],
                  ["Vercel", "Hosting and edge network"],
                  ["Resend / SMTP", "Transactional email delivery"],
                ].map(([service, purpose], i) => (
                  <tr key={i} className="border-b border-white/[0.04] last:border-b-0">
                    <td className="px-4 py-2.5 font-[500] text-white">{service}</td>
                    <td className="px-4 py-2.5">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 6 */}
        <Section title="6. Cookies">
          <p>
            Clinch uses session cookies to keep you logged in. We do not use
            third-party advertising cookies or tracking pixels. You can disable
            cookies in your browser settings, but doing so will prevent you from
            staying logged in.
          </p>
        </Section>

        {/* 7 */}
        <Section title="7. Data Retention">
          <p>
            We retain your account data for as long as your account is active. If
            you delete your account, we will delete your personal data within 30 days,
            except where we are required to retain it by law (e.g., financial records
            for tax purposes, which may be retained for up to 7 years).
          </p>
        </Section>

        {/* 8 */}
        <Section title="8. Your Rights">
          <p>Depending on your location, you may have the right to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li><strong className="text-white">Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong className="text-white">Correction</strong> — request that we correct inaccurate data</li>
            <li><strong className="text-white">Deletion</strong> — request that we delete your account and data</li>
            <li><strong className="text-white">Portability</strong> — request an export of your proposals and invoices</li>
            <li><strong className="text-white">Objection</strong> — object to our processing of your data</li>
          </ul>
          <p className="mt-4">
            To exercise any of these rights, email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-white underline underline-offset-2 hover:text-[#e8a338] transition-colors">
              {CONTACT_EMAIL}
            </a>
            . We will respond within 30 days.
          </p>
        </Section>

        {/* 9 */}
        <Section title="9. Children's Privacy">
          <p>
            Clinch is not directed at children under 13. We do not knowingly collect
            personal data from children. If you believe a child has provided us with
            personal information, please contact us and we will delete it promptly.
          </p>
        </Section>

        {/* 10 */}
        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. When we do, we will
            update the &quot;Last updated&quot; date at the top of this page. For significant
            changes, we will notify you by email or by a prominent notice in the app.
            Continued use of Clinch after changes are posted constitutes your
            acceptance of the updated policy.
          </p>
        </Section>

        {/* 11 */}
        <Section title="11. Contact Us">
          <p>
            For any privacy-related questions or requests, contact us at:
          </p>
          <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-5 py-4">
            <p className="font-[500] text-white">Clinch</p>
            <p>
              Email:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-white underline underline-offset-2 hover:text-[#e8a338] transition-colors">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p>Website: <span className="text-white">useclinch.com</span></p>
          </div>
        </Section>

        {/* Back link */}
        <div className="border-t border-white/[0.06] pt-8">
          <Link
            href="/"
            className="text-[13px] text-[#62666d] underline underline-offset-2 hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
          <span className="mx-4 text-[#3a3f45]">·</span>
          <Link
            href="/terms"
            className="text-[13px] text-[#62666d] underline underline-offset-2 hover:text-white transition-colors"
          >
            Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[18px] font-[600] tracking-[-0.02em] text-white">{title}</h2>
      {children}
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-[14px] font-[600] text-white">{title}</h3>
      <p className="mt-1.5">{children}</p>
    </div>
  );
}
