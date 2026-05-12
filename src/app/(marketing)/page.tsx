import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  FileText,
  CreditCard,
  Zap,
  Send,
  Check,
  ArrowRight,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Hero
   ═══════════════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-0 md:pt-40">
      {/* Mesh grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
    `,
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 35%, transparent 100%)",
          filter: "blur(1.5px)",   // 👈 main blur
          opacity: 0.4,            // 👈 controls intensity after blur
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        {/* Eyebrow pill */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/3 px-4 py-1.5 text-[12px] font-medium text-text-tertiary backdrop-blur-sm">
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: "#e8a338" }}
          />
          Now in public beta — free forever
        </div>

        <h1 className="text-5xl font-medium leading-[1.04] tracking-display-lg text-text-primary md:text-[72px]">
          Stop writing proposals
          <br />
          <span className="text-text-quaternary">Start winning clients.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed tracking-body-lg text-text-tertiary">
          Paste a job description. Get an interactive proposal your client can review, sign, and pay — in 30 seconds. Built by a dev, for devs.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="rounded-md px-7 py-3 text-sm font-semibold text-[#08090a] shadow-md transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ backgroundColor: "#e8a338" }}
          >
            <Link href="/signup">
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="rounded-md border border-white/[0.08] bg-white/[0.02] px-7 py-3 text-sm font-medium text-text-secondary hover:bg-white/[0.05] hover:text-text-primary transition-colors"
          >
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>

        <p className="mt-5 text-[12px] text-text-quaternary">
          No credit card required · Free forever on the Starter plan
        </p>
      </div>

      {/* Dashboard mockup */}
      <div className="relative mx-auto mt-20 max-w-5xl px-6">
        {/* Fade out at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-surface-0 to-transparent z-10 pointer-events-none" />

        <div
          className="overflow-hidden rounded-xl border border-white/[0.07] shadow-2xl"
          style={{ backgroundColor: "#0d0e10" }}
        >
          {/* Window chrome */}
          <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#eb5757]/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#ffc47c]/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#27a644]/60" />
            </div>
            <span className="text-[11px] text-text-quaternary">
              clinch.app/dashboard
            </span>
            <div className="w-14" />
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="hidden w-52 border-r border-white/[0.04] p-3 md:block" style={{ backgroundColor: "#0b0c0e" }}>
              <div className="mb-4 flex items-center gap-2 px-2 py-1">
                <div
                  className="h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold text-[#08090a]"
                  style={{ backgroundColor: "#e8a338" }}
                >
                  C
                </div>
                <span className="text-[13px] font-medium text-text-primary">Clinch</span>
              </div>
              {["Dashboard", "Proposals", "Invoices", "Clients", "Settings"].map(
                (item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[12px] font-medium mb-0.5 ${i === 1
                      ? "bg-white/[0.05] text-text-primary"
                      : "text-text-quaternary"
                      }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${i === 1 ? "opacity-100" : "opacity-0"
                        }`}
                      style={{ backgroundColor: "#e8a338" }}
                    />
                    {item}
                  </div>
                )
              )}
            </div>

            {/* Main content */}
            <div className="flex-1 p-5">
              {/* Stats row */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Proposals Sent", value: "24", delta: "+12%" },
                  { label: "Win Rate", value: "68%", delta: "+5%" },
                  { label: "Revenue", value: "$12,400", delta: "+23%" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3"
                  >
                    <p className="text-[10px] font-medium text-text-quaternary">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-xl font-medium tracking-heading-2 text-text-primary">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-[#27a644]">
                      {stat.delta} this month
                    </p>
                  </div>
                ))}
              </div>

              {/* Proposals table */}
              <div className="rounded-lg border border-white/[0.05] overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2.5">
                  <p className="text-[12px] font-medium text-text-secondary">
                    Recent Proposals
                  </p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: "rgba(232,163,56,0.15)", color: "#e8a338" }}
                  >
                    3 pending
                  </span>
                </div>
                {[
                  { name: "Website Redesign", client: "Acme Corp", amount: "$4,800", status: "Sent" },
                  { name: "Mobile App MVP", client: "StartupXYZ", amount: "$12,000", status: "Won" },
                  { name: "API Integration", client: "TechCo", amount: "$2,400", status: "Draft" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between border-b border-white/[0.04] last:border-0 bg-white/[0.01] px-4 py-2.5"
                  >
                    <div>
                      <p className="text-[12px] font-medium text-text-primary">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-text-quaternary">{item.client}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-medium text-text-secondary">
                        {item.amount}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${item.status === "Won"
                          ? "bg-[#27a644]/15 text-[#27a644]"
                          : item.status === "Sent"
                            ? "text-[#e8a338]"
                            : "bg-white/[0.05] text-text-quaternary"
                          }`}
                        style={
                          item.status === "Sent"
                            ? { backgroundColor: "rgba(232,163,56,0.15)" }
                            : {}
                        }
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   The Problem
   ═══════════════════════════════════════════════════════════════ */
const problemStats = [
  {
    value: "25",
    unit: "minutes per proposal",
    description:
      "Industry average for writing a custom proposal from scratch. Multiply by how many you send each month.",
  },
  {
    value: "<5%",
    unit: "Average response rate",
    description:
      "Most proposals go unanswered. Speed and quality of the first impression are the two levers you actually control.",
  },
  {
    value: "$800",
    unit: "Lost monthly at $100/hr",
    description:
      "Proposals, invoicing, chasing payments. That's the real cost of doing business manually with no tools helping you.",
  },
];

function TheProblem() {
  return (
    <section className="border-t border-white/[0.05] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-quaternary">
            The Problem
          </p>
          <h2 className="mt-3 text-4xl font-medium leading-[1.1] tracking-heading-1 text-text-primary">
            You&apos;re bleeding hours
            <br />
            every month.
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-text-tertiary">
            The average freelance dev sends 4 proposals a month. Each one takes
            25 minutes. That&apos;s 100 minutes — unbillable — every single
            month.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {problemStats.map((stat) => (
            <div
              key={stat.unit}
              className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.03]"
            >
              <p className="text-3xl font-medium tracking-heading-1 text-text-primary">
                {stat.value}
              </p>
              <p
                className="mt-1 text-[13px] font-semibold"
                style={{ color: "#e8a338" }}
              >
                {stat.unit}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-text-quaternary">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



/* ═══════════════════════════════════════════════════════════════
   How It Works
   ═══════════════════════════════════════════════════════════════ */
const steps = [
  {
    number: "01",
    icon: "◆",
    title: "Set up your profile once",
    description:
      "Upload your logo, set your brand color, write a 2-line bio. The AI uses this context in every proposal it writes for you — forever.",
  },
  {
    number: "02",
    icon: "●",
    title: "Paste the job or fill 5 fields",
    description:
      "Paste the raw job description, or fill in client name, project type, budget, timeline, and deliverables. Pick your tone.",
  },
  {
    number: "03",
    icon: "◆",
    title: "AI writes the full proposal",
    description:
      "Hook, problem, solution, deliverables, timeline, pricing, CTA. Editable before export. Sounds like you — not a robot.",
  },
  {
    number: "04",
    icon: "▬",
    title: "Share a link. Client accepts & pays.",
    description:
      "Send your client a branded hosted link. They review the proposal, e-sign to accept, and pay the deposit — all on one page. No PDFs to chase.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/[0.05] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-quaternary">
            How it works
          </p>
          <h2 className="mt-3 text-4xl font-medium leading-[1.1] tracking-heading-1 text-text-primary">
            Four steps.
            <br />
            Thirty seconds.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.03]"
            >
              {/* Step number — amber */}
              <p
                className="mb-5 text-[11px] font-semibold"
                style={{ color: "#e8a338" }}
              >
                {step.number}
              </p>

              {/* Icon — amber tinted box, same as Features */}
              <div
                className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg text-sm"
                style={{ backgroundColor: "rgba(232,163,56,0.12)", color: "#e8a338" }}
              >
                {step.icon}
              </div>

              <h3 className="text-[14px] font-medium text-text-primary leading-snug">
                {step.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-text-tertiary">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Features — Bento Grid
   ═══════════════════════════════════════════════════════════════ */
function Features() {
  return (
    <section id="features" className="border-t border-white/[0.05] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-quaternary">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-heading-1 text-text-primary">
            Everything you need to close deals
          </h2>
          <p className="mt-3 text-[15px] text-text-tertiary">
            One tool for proposals, invoices, and payments.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-12 gap-4">
          {/* Large card — AI Proposals */}
          <div className="col-span-12 row-span-2 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-8 md:col-span-7 transition-colors hover:bg-white/[0.03]">
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(232,163,56,0.12)" }}
            >
              <Sparkles className="h-5 w-5" style={{ color: "#e8a338" }} />
            </div>
            <h3 className="text-xl font-medium text-text-primary">
              AI Proposal Generation
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-text-tertiary">
              Turn project briefs into polished, persuasive proposals with one
              click. Our AI writes in your tone and highlights your strengths.
            </p>
            {/* Mini preview */}
            <div className="mt-8 rounded-lg border border-white/[0.05] bg-surface-1 p-4">
              {/* Title */}
              <div className="mb-2 h-2 w-32 rounded-full relative overflow-hidden bg-white/[0.05]">
                <div className="absolute inset-0 animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
              </div>

              {/* Lines */}
              <div className="mb-1.5 h-2 w-full rounded-full relative overflow-hidden bg-white/[0.05]">
                <div className="absolute inset-0 animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              </div>

              <div className="mb-1.5 h-2 w-5/6 rounded-full relative overflow-hidden bg-white/[0.05]">
                <div className="absolute inset-0 animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              </div>

              <div className="h-2 w-4/6 rounded-full relative overflow-hidden bg-white/[0.05]">
                <div className="absolute inset-0 animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
              </div>

              {/* Buttons */}
              <div className="mt-4 flex items-center gap-2">

                {/* REAL BUTTON (visible) */}
                <div
                  className="h-6 rounded px-3 flex items-center text-[11px] font-medium text-[#08090a]"
                  style={{ backgroundColor: "#e8a338" }}
                >
                  Generate Proposal
                </div>

                {/* Skeleton button */}
                <div className="h-6 w-16 rounded relative overflow-hidden border border-white/[0.05] bg-white/[0.05]">
                  <div className="absolute inset-0 animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* Stripe Payment Links */}
          <div className="col-span-12 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 md:col-span-5 transition-colors hover:bg-white/[0.03]">
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(232,163,56,0.12)" }}
            >
              <CreditCard className="h-5 w-5" style={{ color: "#e8a338" }} />
            </div>
            <h3 className="text-lg font-medium text-text-primary">
              Accept & Pay on Page
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-tertiary">
              Your client reviews, e-signs, and pays a deposit — all on a single hosted page. No back-and-forth emails.
            </p>
          </div>

          {/* Branded PDFs */}
          <div className="col-span-12 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 md:col-span-5 transition-colors hover:bg-white/[0.03]">
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(232,163,56,0.12)" }}
            >
              <FileText className="h-5 w-5" style={{ color: "#e8a338" }} />
            </div>
            <h3 className="text-lg font-medium text-text-primary">
              Themed Hosted Proposals
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-tertiary">
              Choose from multiple templates and themes. Your logo, brand colors, and content — presented on a professional hosted page your client can access anytime.
            </p>
          </div>

          {/* Invoice Builder */}
          <div className="col-span-12 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 md:col-span-4 transition-colors hover:bg-white/[0.03]">
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(232,163,56,0.12)" }}
            >
              <Zap className="h-5 w-5" style={{ color: "#e8a338" }} />
            </div>
            <h3 className="text-lg font-medium text-text-primary">
              Invoice Builder
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-tertiary">
              Line items, tax, discounts. Auto-calculated totals. Generate invoices in under 2 minutes.
            </p>
          </div>

          {/* One-click send */}
          <div className="col-span-12 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 md:col-span-4 transition-colors hover:bg-white/[0.03]">
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(232,163,56,0.12)" }}
            >
              <Send className="h-5 w-5" style={{ color: "#e8a338" }} />
            </div>
            <h3 className="text-lg font-medium text-text-primary">
              Share a Link
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-tertiary">
              Copy a hosted link or share via email. Your client sees a live, interactive proposal — not a static attachment.
            </p>
          </div>

          {/* Win rate stat card */}
          <div
            className="col-span-12 flex flex-col justify-between overflow-hidden rounded-xl border p-6 md:col-span-4"
            style={{
              borderColor: "rgba(232,163,56,0.2)",
              background:
                "linear-gradient(135deg, rgba(232,163,56,0.06) 0%, rgba(232,163,56,0.02) 100%)",
            }}
          >
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(232,163,56,0.12)" }}
            >
              <TrendingUp className="h-5 w-5" style={{ color: "#e8a338" }} />
            </div>
            <div>
              <p
                className="text-4xl font-medium tracking-display"
                style={{ color: "#e8a338" }}
              >
                2.4×
              </p>
              <p className="mt-1 text-[13px] font-medium text-text-primary">
                higher win rate
              </p>
              <p className="mt-1 text-[12px] text-text-quaternary">
                vs. manually written proposals
              </p>
            </div>
          </div>

          {/* Time saved card */}
          <div className="col-span-12 flex items-center gap-6 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 md:col-span-6 transition-colors hover:bg-white/[0.03]">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(232,163,56,0.12)" }}
            >
              <Clock className="h-6 w-6" style={{ color: "#e8a338" }} />
            </div>
            <div>
              <p className="text-2xl font-medium text-text-primary">
                Save 3+ hours
              </p>
              <p className="mt-1 text-[13px] text-text-tertiary">
                per client. Redirect that time to building, not writing.
              </p>
            </div>
          </div>

          {/* Client management */}
          <div className="col-span-12 flex items-center gap-6 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 md:col-span-6 transition-colors hover:bg-white/[0.03]">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(232,163,56,0.12)" }}
            >
              <span className="text-xl" style={{ color: "#e8a338" }}>＄</span>
            </div>
            <div>
              <p className="text-2xl font-medium text-text-primary">
                Get paid faster
              </p>
              <p className="mt-1 text-[13px] text-text-tertiary">
                Clients pay in minutes with embedded Stripe links — not weeks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Comparison Table
   ═══════════════════════════════════════════════════════════════ */
const comparisonRows = [
  {
    feature: "AI writes proposal for you",
    bonsai: { label: "✗ You write it", positive: false },
    honeybook: { label: "✗ You write it", positive: false },
    clinch: { label: "✓ 30 seconds", positive: true },
  },
  {
    feature: "Interactive hosted proposals",
    bonsai: { label: "✗ Static PDF", positive: false },
    honeybook: { label: "✗ Static PDF", positive: false },
    clinch: { label: "✓ Live hosted page", positive: true },
  },
  {
    feature: "Client e-sign & pay on page",
    bonsai: { label: "✗ Separate flow", positive: false },
    honeybook: { label: "~ Partial", positive: false },
    clinch: { label: "✓ One page", positive: true },
  },
  {
    feature: "Real-time proposal analytics",
    bonsai: { label: "✗", positive: false },
    honeybook: { label: "✗", positive: false },
    clinch: { label: "✓ Views, reads, time", positive: true },
  },
  {
    feature: "Built for developers",
    bonsai: { label: "✗ Generic", positive: false },
    honeybook: { label: "✗ Generic", positive: false },
    clinch: { label: "✓ Dev-native", positive: true },
  },
  {
    feature: "Time tracking, CRM, taxes",
    bonsai: { label: "✓ (you pay for it)", positive: null },
    honeybook: { label: "✓ (you pay for it)", positive: null },
    clinch: { label: "✗ Deliberately removed", positive: null },
  },
  {
    feature: "Price to unlock proposals",
    bonsai: { label: "$37/mo", positive: false },
    honeybook: { label: "$66/mo", positive: false },
    clinch: { label: "$19/mo", positive: true },
    isPrice: true,
  },
];

function ComparisonTable() {
  return (
    <section className="border-t border-white/[0.05] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-quaternary">
            Why not Bonsai or Honeybook?
          </p>
          <h2 className="mt-3 text-4xl font-medium leading-[1.1] tracking-heading-1 text-text-primary">
            They sell you a blank page.
            <br />
            We write it for you.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-text-tertiary">
            Both are great all-in-one tools. Neither one does the hard part —
            the writing. We do one thing better than anyone else.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/[0.07]">
          {/* Header */}
          <div className="grid grid-cols-4 border-b border-white/[0.07] bg-white/[0.02]">
            <div className="px-5 py-3.5 text-[12px] font-medium text-text-quaternary">
              Feature
            </div>
            <div className="border-l border-white/[0.07] px-5 py-3.5 text-[12px] font-medium text-text-tertiary">
              Bonsai ($37/mo)
            </div>
            <div className="border-l border-white/[0.07] px-5 py-3.5 text-[12px] font-medium text-text-tertiary">
              HoneyBook ($66/mo)
            </div>
            <div
              className="border-l border-white/[0.1] px-5 py-3.5 text-[12px] font-semibold text-text-primary"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            >
              Clinch ($19/mo)
            </div>
          </div>

          {/* Rows */}
          {comparisonRows.map((row) => (
            <div
              key={row.feature}
              className="grid grid-cols-4 border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.015] transition-colors"
            >
              <div className="px-5 py-3.5 text-[13px] font-medium text-text-secondary">
                {row.feature}
              </div>
              <div className="border-l border-white/[0.05] px-5 py-3.5 text-[13px] text-text-quaternary">
                {row.bonsai.label}
              </div>
              <div className="border-l border-white/[0.05] px-5 py-3.5 text-[13px] text-text-quaternary">
                {row.honeybook.label}
              </div>
              <div
                className="border-l border-white/[0.07] px-5 py-3.5 text-[13px] font-medium"
                style={{
                  backgroundColor: "rgba(255,255,255,0.025)",
                  color: row.clinch.positive === true
                    ? "#e8a338"
                    : row.clinch.positive === null
                      ? "#62666d"
                      : "#8a8f98",
                }}
              >
                {row.clinch.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Pricing
   ═══════════════════════════════════════════════════════════════ */
const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "For freelancers just getting started",
    features: [
      "5 AI proposals per month",
      "Hosted proposal pages",
      "Invoice Builder",
      "Clinch branding on proposals",
    ],
    cta: "Get started free",
    href: "/signup",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For freelancers ready to scale",
    features: [
      "Unlimited AI proposals",
      "Custom branding — no watermark",
      "Client e-sign & payments",
      "Proposal analytics",
      "Priority support",
    ],
    cta: "Start Pro",
    href: "/signup",
    popular: true,
  },
  {
    name: "Agency",
    price: "$39",
    period: "per month",
    description: "For teams and high-volume freelancers",
    features: [
      "Everything in Pro",
      "Team members (coming soon)",
      "White-label proposals",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Go Agency",
    href: "/signup",
    popular: false,
  },
];

function Pricing() {
  return (
    <section
      id="pricing"
      className="border-t border-white/5 py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-quaternary">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-heading-1 text-text-primary">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-[15px] text-text-tertiary">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl border p-7 transition-all ${plan.popular
                ? "shadow-2xl"
                : "border-white/[0.07] bg-white/2 hover:bg-white/3"
                }`}
              style={
                plan.popular
                  ? {
                    borderColor: "rgba(232,163,56,0.35)",
                    background:
                      "linear-gradient(160deg, rgba(232,163,56,0.07) 0%, rgba(232,163,56,0.02) 50%, #0d0e0f 100%)",
                  }
                  : {}
              }
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold text-[#08090a]"
                  style={{ backgroundColor: "#e8a338" }}
                >
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {plan.name}
                </h3>
                <p className="mt-1 text-[13px] text-text-quaternary">
                  {plan.description}
                </p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-4xl font-medium tracking-heading-1 text-text-primary">
                    {plan.price}
                  </span>
                  <span className="text-[13px] text-text-quaternary">
                    /{plan.period}
                  </span>
                </div>
              </div>

              <ul className="mt-7 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-[13px] text-text-secondary"
                  >
                    <Check
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      style={{ color: "#e8a338" }}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`mt-8 w-full rounded-md text-[13px] font-semibold transition-all ${plan.popular
                  ? "hover:opacity-90 hover:scale-[1.01] text-[#08090a]"
                  : "border border-white/8 bg-white/2 text-text-secondary hover:bg-white/5 hover:text-text-primary"
                  }`}
                style={plan.popular ? { backgroundColor: "#e8a338" } : {}}
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[12px] text-text-quaternary">
          All paid plans include a 14-day free trial. No credit card required to
          start.
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Final CTA
   ═══════════════════════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section className="border-t border-white/[0.05] py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6 text-center">
        {/* Glowing orb */}
        {/* <div className="relative mx-auto mb-10 flex h-16 w-16 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-60"
            style={{ backgroundColor: "#e8a338" }}
          />
          <div
            className="relative flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-[#08090a]"
            style={{ backgroundColor: "#e8a338" }}
          >
            C
          </div>
        </div> */}

        <h2 className="text-4xl font-medium tracking-heading-1 text-text-primary md:text-5xl">
          Ready to win your next client?
        </h2>
        <p className="mt-4 text-lg text-text-tertiary">
          Join thousands of freelancers who close deals faster with Clinch.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="rounded-md px-8 py-3 text-sm font-semibold text-[#08090a] transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ backgroundColor: "#e8a338" }}
          >
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-[13px] text-text-quaternary">
            No credit card · Free forever on Starter
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Page — Homepage
   ═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <>
      <Hero />
      <TheProblem />
      {/* <Testimonials /> */}
      <HowItWorks />
      <Features />
      <ComparisonTable />
      <Pricing />
      <FinalCTA />
    </>
  );
}
