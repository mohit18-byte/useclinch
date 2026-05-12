import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/dashboard — aggregated stats for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // ── Parallel fetches ────────────────────────────────────
    const [proposalsRes, invoicesRes, clientsRes] = await Promise.all([
      supabase
        .from('proposals')
        .select('id, client_name, project_title, amount, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('invoices')
        .select('id, client_name, invoice_number, total_cents, currency, status, paid_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id),
    ]);

    const proposals = proposalsRes.data || [];
    const invoices = invoicesRes.data || [];
    const clients = clientsRes.data || [];

    // ── Proposal stats ──────────────────────────────────────
    const proposalsSent = proposals.filter(
      (p) => p.status !== 'draft'
    ).length;

    const accepted = proposals.filter(
      (p) => p.status === 'accepted' || p.status === 'won'
    ).length;
    const decidable = proposals.filter(
      (p) =>
        p.status === 'accepted' ||
        p.status === 'won' ||
        p.status === 'lost'
    ).length;
    const winRate = decidable > 0 ? Math.round((accepted / decidable) * 100) : 0;

    // ── Invoice stats ───────────────────────────────────────
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const paidInvoicesThisMonth = invoices.filter(
      (i) =>
        i.status === 'paid' &&
        i.paid_at &&
        new Date(i.paid_at) >= monthStart
    );
    const revenueThisMonth = paidInvoicesThisMonth.reduce(
      (sum, i) => sum + (i.total_cents || 0),
      0
    );

    const unpaidCount = invoices.filter((i) => i.status === 'unpaid').length;
    const unpaidTotal = invoices
      .filter((i) => i.status === 'unpaid')
      .reduce((sum, i) => sum + (i.total_cents || 0), 0);

    // ── Recent activity (last 8 items) ──────────────────────
    type ActivityItem = {
      id: string;
      type: 'proposal' | 'invoice';
      label: string;
      subLabel: string;
      time: string;
      sortDate: string;
    };

    const activity: ActivityItem[] = [];

    // Proposals → activity
    for (const p of proposals.slice(0, 10)) {
      const statusLabel =
        p.status === 'draft'
          ? 'Created'
          : p.status === 'accepted'
            ? '✓ Accepted'
            : p.status === 'won'
              ? '✓ Won'
              : p.status === 'lost'
                ? '✗ Lost'
                : 'Sent';
      activity.push({
        id: `p-${p.id}`,
        type: 'proposal',
        label: `${p.project_title}`,
        subLabel: `${p.client_name} · ${statusLabel}`,
        time: relativeTime(p.created_at),
        sortDate: p.created_at,
      });
    }

    // Invoices → activity
    for (const i of invoices.slice(0, 10)) {
      const statusLabel =
        i.status === 'paid'
          ? '✓ Paid'
          : i.status === 'cancelled'
            ? 'Cancelled'
            : 'Unpaid';
      activity.push({
        id: `i-${i.id}`,
        type: 'invoice',
        label: `${i.invoice_number} — ${fmt(i.total_cents, i.currency)}`,
        subLabel: `${i.client_name} · ${statusLabel}`,
        time: relativeTime(i.created_at),
        sortDate: i.created_at,
      });
    }

    // Sort by date, take latest 8
    activity.sort(
      (a, b) =>
        new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
    );
    const recentActivity = activity.slice(0, 8).map(({ sortDate: _, ...rest }) => rest);

    return NextResponse.json({
      proposalsSent,
      proposalsTotal: proposals.length,
      winRate,
      revenueThisMonth,
      unpaidCount,
      unpaidTotal,
      clientCount: clients.length,
      recentActivity,
    });
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    return NextResponse.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function fmt(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}
