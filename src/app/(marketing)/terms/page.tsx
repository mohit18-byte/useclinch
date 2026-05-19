import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Clinch",
  description: "The terms and conditions for using the Clinch platform.",
};

const LAST_UPDATED = "May 19, 2025";
const CONTACT_EMAIL = "hello@useclinch.com";

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      {/* Header */}
      <div className="mb-12">
        <p className="text-[13px] font-[500] uppercase tracking-widest text-[#62666d]">
          Legal
        </p>
        <h1 className="mt-3 text-[36px] font-[600] tracking-[-0.03em] text-white">
          Terms of Service
        </h1>
        <p className="mt-3 text-[15px] text-[#62666d]">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <div className="prose prose-invert prose-sm max-w-none space-y-10 text-[15px] leading-relaxed text-[#8a8f98]">

        {/* Intro */}
        <section>
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your use of the Clinch platform
            (&quot;Service&quot;) operated by Clinch (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By creating an
            account or using Clinch, you agree to be bound by these Terms. If you do
            not agree, do not use the Service.
          </p>
        </section>

        {/* 1 */}
        <Section title="1. Eligibility">
          <p>
            You must be at least 13 years old to use Clinch. By using the Service,
            you represent that you are at least 13 and have the legal capacity to
            enter into a binding agreement. If you are using Clinch on behalf of a
            business, you represent that you have authority to bind that business to
            these Terms.
          </p>
        </Section>

        {/* 2 */}
        <Section title="2. Account Registration">
          <p>
            You must provide accurate, complete, and current information when creating
            your account. You are responsible for maintaining the confidentiality of
            your password and for all activity that occurs under your account. Notify
            us immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-white underline underline-offset-2 hover:text-[#e8a338] transition-colors">
              {CONTACT_EMAIL}
            </a>{" "}
            if you believe your account has been compromised.
          </p>
          <p className="mt-3">
            You may not share your account credentials, create accounts for others
            without their consent, or create multiple accounts to circumvent usage
            limits.
          </p>
        </Section>

        {/* 3 */}
        <Section title="3. Free and Pro Plans">
          <Subsection title="Free (Starter) Plan">
            The Free plan allows you to generate up to 3 AI proposals per month, create
            invoices, manage clients, and access hosted proposal pages. Free plan limits
            may change with reasonable notice.
          </Subsection>
          <Subsection title="Pro Plan">
            The Pro plan provides unlimited AI proposals and additional features. Pro
            is a paid subscription billed monthly or annually via Stripe. Prices are
            shown on the pricing page and may change with at least 30 days notice to
            existing subscribers.
          </Subsection>
          <Subsection title="Upgrades and Downgrades">
            You may upgrade or downgrade your plan at any time. Upgrades take effect
            immediately. Downgrades take effect at the end of your current billing
            period. No partial refunds are provided for unused time on a downgraded
            plan unless required by applicable law.
          </Subsection>
        </Section>

        {/* 4 */}
        <Section title="4. Payment and Billing">
          <p>
            By subscribing to Pro, you authorise us to charge your payment method on
            a recurring basis until you cancel. All prices are in USD unless otherwise
            stated. We use Stripe to process payments securely — your full card
            details are never stored on our servers.
          </p>
          <p className="mt-3">
            If a payment fails, we will retry using Stripe&apos;s standard retry logic.
            After repeated failures, your account may be downgraded to the Free plan.
            You are responsible for keeping your payment information up to date.
          </p>
        </Section>

        {/* 5 */}
        <Section title="5. Refund Policy">
          <p>
            We offer a <strong className="text-white">7-day refund</strong> on your first Pro subscription
            payment if you are not satisfied. To request a refund, email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-white underline underline-offset-2 hover:text-[#e8a338] transition-colors">
              {CONTACT_EMAIL}
            </a>{" "}
            within 7 days of your first charge. Subsequent billing periods are
            non-refundable.
          </p>
        </Section>

        {/* 6 */}
        <Section title="6. Acceptable Use">
          <p>You agree not to use Clinch to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Violate any applicable law or regulation</li>
            <li>Generate content that is fraudulent, misleading, or deceptive to clients</li>
            <li>Harass, threaten, or harm any individual</li>
            <li>Infringe the intellectual property rights of others</li>
            <li>Scrape, reverse-engineer, or attempt to extract our source code or AI prompts</li>
            <li>Attempt to circumvent usage limits (e.g. creating multiple free accounts)</li>
            <li>Use the Service in a way that disrupts or degrades our infrastructure</li>
            <li>Resell or sublicense access to the Service without our written consent</li>
          </ul>
          <p className="mt-4">
            We reserve the right to suspend or terminate accounts that violate these
            rules without notice.
          </p>
        </Section>

        {/* 7 */}
        <Section title="7. Your Content and Ownership">
          <p>
            You retain full ownership of all content you create using Clinch — including
            proposals, invoices, client data, and profile information. We do not claim
            any intellectual property rights over your content.
          </p>
          <p className="mt-3">
            By using Clinch, you grant us a limited, non-exclusive licence to store,
            process, and display your content solely for the purpose of providing the
            Service to you. This licence ends when you delete your account.
          </p>
          <p className="mt-3">
            You are responsible for ensuring that any job descriptions, client
            information, or other data you enter into Clinch does not infringe third-party
            rights or violate any confidentiality obligations you may have.
          </p>
        </Section>

        {/* 8 */}
        <Section title="8. AI-Generated Content">
          <p>
            Clinch uses AI (OpenAI&apos;s GPT models) to assist in generating proposal
            content. You acknowledge that:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>AI-generated content may not always be accurate, complete, or suitable for your specific situation</li>
            <li>You are responsible for reviewing, editing, and approving all proposals before sending them to clients</li>
            <li>We make no guarantees that AI-generated proposals will result in winning clients or projects</li>
            <li>You should not rely on AI-generated pricing, timelines, or technical claims without verification</li>
          </ul>
        </Section>

        {/* 9 */}
        <Section title="9. Intellectual Property">
          <p>
            The Clinch name, logo, product design, codebase, and all associated
            intellectual property are owned by us and protected by copyright and other
            laws. You may not copy, reproduce, or create derivative works from our
            branding or code without explicit written permission.
          </p>
        </Section>

        {/* 10 */}
        <Section title="10. Service Availability">
          <p>
            We aim to provide a reliable service but do not guarantee 100% uptime.
            We may perform scheduled or emergency maintenance that temporarily interrupts
            access. We are not liable for any losses arising from service downtime.
          </p>
          <p className="mt-3">
            We reserve the right to modify, suspend, or discontinue any feature of the
            Service at any time, with reasonable notice where possible.
          </p>
        </Section>

        {/* 11 */}
        <Section title="11. Disclaimer of Warranties">
          <p>
            Clinch is provided on an <strong className="text-white">&quot;as is&quot; and &quot;as available&quot;</strong> basis,
            without warranties of any kind — express or implied — including but not
            limited to warranties of merchantability, fitness for a particular purpose,
            or non-infringement. We do not warrant that the Service will be error-free,
            uninterrupted, or that any defects will be corrected.
          </p>
        </Section>

        {/* 12 */}
        <Section title="12. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, Clinch and its operators
            shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages — including loss of profits, data, or business — arising
            from your use of or inability to use the Service.
          </p>
          <p className="mt-3">
            Our total liability to you for any claim arising from these Terms or your
            use of the Service shall not exceed the amount you paid us in the 3 months
            preceding the claim.
          </p>
        </Section>

        {/* 13 */}
        <Section title="13. Indemnification">
          <p>
            You agree to indemnify and hold harmless Clinch and its operators from any
            claims, damages, losses, or expenses (including legal fees) arising from:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Your use of the Service in violation of these Terms</li>
            <li>Your content or the content you submit to the Service</li>
            <li>Your violation of any third-party rights</li>
          </ul>
        </Section>

        {/* 14 */}
        <Section title="14. Termination">
          <p>
            You may delete your account at any time from account settings. Upon
            deletion, your data will be removed within 30 days.
          </p>
          <p className="mt-3">
            We may suspend or terminate your account if you violate these Terms,
            engage in fraudulent activity, or if we decide to discontinue the Service.
            Upon termination, your right to use the Service ceases immediately.
          </p>
        </Section>

        {/* 15 */}
        <Section title="15. Changes to These Terms">
          <p>
            We may update these Terms at any time. When we do, we will update the
            &quot;Last updated&quot; date. For material changes, we will notify you by email
            at least 14 days before the changes take effect. Continued use of the
            Service after changes take effect constitutes your acceptance of the
            new Terms.
          </p>
        </Section>

        {/* 16 */}
        <Section title="16. Governing Law">
          <p>
            These Terms are governed by and construed in accordance with applicable
            law. Any disputes shall be resolved through good-faith negotiation first.
            If negotiation fails, disputes shall be submitted to binding arbitration
            or the courts of the jurisdiction in which we operate.
          </p>
        </Section>

        {/* 17 */}
        <Section title="17. Contact">
          <p>For any questions about these Terms, contact us:</p>
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
            href="/privacy"
            className="text-[13px] text-[#62666d] underline underline-offset-2 hover:text-white transition-colors"
          >
            ← Privacy Policy
          </Link>
          <span className="mx-4 text-[#3a3f45]">·</span>
          <Link
            href="/"
            className="text-[13px] text-[#62666d] underline underline-offset-2 hover:text-white transition-colors"
          >
            Back to home →
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
