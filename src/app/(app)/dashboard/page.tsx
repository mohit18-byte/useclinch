"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Receipt,
  ArrowUpRight,
  Plus,
  Clock,
  Users,
  AlertTriangle,
  Zap,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */
interface DashboardData {
  proposalsTotal: number;
  activeProposals: number;   // sent + viewed (in-flight, client has access)
  unpaidCount: number;
  unpaidTotal: number;
  clientCount: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: "proposal" | "invoice";
  label: string;
  subLabel: string;
  time: string;
}

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/* ── Stat Card ─────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-[#1a1c20] bg-[#0c0d0e] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-[500] uppercase tracking-wide text-[#62666d]">
          {label}
        </p>
        <Icon className="h-4 w-4 text-[#3a3f45]" />
      </div>
      <p
        className={`mt-3 text-[28px] font-[600] tracking-[-0.03em] leading-none ${
          accent || "text-white"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 text-[12px] text-[#62666d]">{sub}</p>
      )}
    </div>
  );
}

/* ── Skeleton Card ─────────────────────────────────────────── */
function StatSkeleton() {
  return (
    <div className="rounded-lg border border-[#1a1c20] bg-[#0c0d0e] p-5">
      <Skeleton className="h-3 w-24 bg-[#1a1c20]" />
      <Skeleton className="mt-4 h-8 w-16 bg-[#1a1c20]" />
      <Skeleton className="mt-2 h-3 w-32 bg-[#1a1c20]" />
    </div>
  );
}

/* ── Empty State Card ──────────────────────────────────────── */
function EmptyCard({
  icon: Icon,
  title,
  description,
  cta,
  href,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#1a1c20] bg-[#0c0d0e]/50 p-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#14161a]">
        <Icon className="h-5 w-5 text-[#62666d]" />
      </div>
      <p className="text-[14px] font-[520] text-[#8a8f98]">{title}</p>
      <p className="mt-1 max-w-[220px] text-[13px] text-[#62666d]">
        {description}
      </p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-[13px] font-[500] text-black transition-colors hover:bg-neutral-200"
      >
        <Plus className="h-3.5 w-3.5" />
        {cta}
      </Link>
    </div>
  );
}

/* ── Activity Row ──────────────────────────────────────────── */
function ActivityRow({ item }: { item: ActivityItem }) {
  const router = useRouter();
  const iconMap = {
    proposal: FileText,
    invoice: Receipt,
  };
  const Icon = iconMap[item.type];
  const href = item.type === "proposal" ? "/proposals" : "/invoices";

  return (
    <div
      onClick={() => router.push(href)}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#14161a]">
        <Icon className="h-3.5 w-3.5 text-[#62666d]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-white">{item.label}</p>
        <p className="truncate text-[12px] text-[#62666d]">{item.subLabel}</p>
      </div>
      <span className="shrink-0 text-[11px] text-[#3a3f45]">{item.time}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Dashboard Page
   ═══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const isEmpty =
    !loading &&
    data &&
    data.proposalsTotal === 0 &&
    data.unpaidCount === 0;

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-[550] tracking-[-0.02em] text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-[13px] text-[#62666d]">
            Your workspace at a glance.
          </p>
        </div>
        <Link
          href="/proposals/new"
          className="hidden items-center gap-1.5 rounded-md bg-white px-4 py-2 text-[13px] font-[500] text-black transition-colors hover:bg-neutral-200 sm:inline-flex"
        >
          <Plus className="h-3.5 w-3.5" />
          New proposal
        </Link>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      ) : data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="All Proposals"
            value={data.proposalsTotal.toString()}
            icon={FileText}
            sub="created all time"
          />
          <StatCard
            label="Active Now"
            value={data.activeProposals > 0 ? data.activeProposals.toString() : "—"}
            icon={Zap}
            sub="sent or viewed by client"
            accent={data.activeProposals > 0 ? "text-indigo-400" : undefined}
          />
          {data.unpaidCount > 0 ? (
            <StatCard
              label="Unpaid"
              value={fmtCents(data.unpaidTotal)}
              icon={AlertTriangle}
              sub={`${data.unpaidCount} invoice${data.unpaidCount !== 1 ? "s" : ""} outstanding`}
              accent="text-amber-400"
            />
          ) : (
            <StatCard
              label="Clients"
              value={data.clientCount.toString()}
              icon={Users}
              sub="in address book"
            />
          )}
        </div>
      ) : null}

      {/* Quick actions + Recent activity */}
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {/* Recent Activity */}
        <div className="lg:col-span-3 rounded-lg border border-[#1a1c20] bg-[#0c0d0e]">
          <div className="flex items-center justify-between border-b border-[#1a1c20] px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[#62666d]" />
              <h2 className="text-[13px] font-[520] text-[#8a8f98]">
                Recent Activity
              </h2>
            </div>
          </div>

          <div className="p-2">
            {loading ? (
              <div className="space-y-2 px-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-md bg-[#1a1c20]" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-40 bg-[#1a1c20]" />
                      <Skeleton className="mt-1.5 h-2.5 w-24 bg-[#1a1c20]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data && data.recentActivity.length > 0 ? (
              data.recentActivity.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Clock className="mb-2 h-5 w-5 text-[#3a3f45]" />
                <p className="text-[13px] text-[#62666d]">
                  No activity yet. Create a proposal to get started.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-2 space-y-3">
          <QuickLink
            href="/proposals/new"
            icon={FileText}
            label="New Proposal"
            description="Generate an AI-powered proposal"
          />
          <QuickLink
            href="/invoices"
            icon={Receipt}
            label="New Invoice"
            description="Create and send an invoice"
          />
          <QuickLink
            href="/clients"
            icon={Users}
            label="Manage Clients"
            description="Add or edit your client list"
          />
          <QuickLink
            href="/settings/profile"
            icon={ArrowUpRight}
            label="Profile Settings"
            description="Update your branding and portfolio"
          />
        </div>
      </div>

      {/* Empty states — only shown when truly empty */}
      {isEmpty && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <EmptyCard
            icon={FileText}
            title="No proposals yet"
            description="Create your first AI-powered proposal in seconds."
            cta="New proposal"
            href="/proposals/new"
          />
          <EmptyCard
            icon={Receipt}
            title="No invoices yet"
            description="Send your first invoice to a client."
            cta="New invoice"
            href="/invoices"
          />
        </div>
      )}
    </div>
  );
}

/* ── Quick Link ────────────────────────────────────────────── */
function QuickLink({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-[#1a1c20] bg-[#0c0d0e] p-4 transition-colors hover:border-[#23252a] hover:bg-[#14161a]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#14161a] group-hover:bg-[#1a1c20] transition-colors">
        <Icon className="h-4 w-4 text-[#62666d] group-hover:text-[#8a8f98] transition-colors" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-[520] text-white">{label}</p>
        <p className="text-[12px] text-[#62666d]">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-[#3a3f45] group-hover:text-[#62666d] transition-colors" />
    </Link>
  );
}
