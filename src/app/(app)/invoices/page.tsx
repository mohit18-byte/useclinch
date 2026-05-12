"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Loader2, Plus, Receipt, X, ExternalLink,
  CheckCircle2, XCircle, DollarSign, AlertTriangle, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Invoice, InvoiceLineItem } from "@/lib/database.types";

/* ── Status badges ──────────────────────────────────────────── */
const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  unpaid: { label: "Unpaid", cls: "bg-amber-500/10 text-amber-400" },
  payment_claimed: { label: "Payment Claimed", cls: "bg-blue-500/10 text-blue-400" },
  paid: { label: "Paid", cls: "bg-green-500/10 text-green-400" },
  cancelled: { label: "Cancelled", cls: "bg-[#23252a] text-[#62666d]" },
};

function fmt(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function isOverdue(invoice: Invoice) {
  return invoice.status === "unpaid" && invoice.due_date && new Date(invoice.due_date) < new Date();
}

function isActionable(invoice: Invoice) {
  // both unpaid and payment_claimed show the edit/mark-paid/cancel buttons
  return invoice.status === "unpaid" || invoice.status === "payment_claimed";
}

/* ═══════════════════════════════════════════════════════════════
   Invoices Page
   ═══════════════════════════════════════════════════════════════ */
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Invoice | null>(null);

  // Pre-fetched data for the New Invoice modal — loaded at page level so modals open instantly
  const [proposals, setProposals] = useState<{ id: string; client_name: string; client_email: string; project_title: string }[]>([]);
  const [profileData, setProfileData] = useState<{ email: string; default_payment_instructions: string } | null>(null);

  const fetchInvoices = useCallback(async () => {
    const res = await fetch("/api/invoices");
    if (res.ok) setInvoices(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
    // Prefetch proposals + profile once for the new invoice modal
    fetch("/api/proposals").then(async (res) => {
      if (res.ok) setProposals(await res.json());
    });
    fetch("/api/profile").then(async (res) => {
      if (res.ok) {
        const p = await res.json();
        setProfileData({
          email: p.email || '',
          default_payment_instructions: p.default_payment_instructions || '',
        });
      }
    });
  }, [fetchInvoices]);

  /* ── Stats ──────────────────────────────────────────────── */
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = invoices.filter((i) => new Date(i.created_at) >= monthStart);
  const totalThisMonth = thisMonth.reduce((s, i) => s + i.total_cents, 0);
  const unpaid = invoices.filter((i) => i.status === "unpaid");
  const unpaidTotal = unpaid.reduce((s, i) => s + i.total_cents, 0);
  const paidCount = invoices.filter((i) => i.status === "paid").length;

  /* ── Actions ────────────────────────────────────────────── */
  async function markPaid(id: string) {
    setActionLoading(id);
    const res = await fetch(`/api/invoices/${id}/mark-paid`, { method: "PATCH" });
    if (res.ok) await fetchInvoices();
    setActionLoading(null);
  }

  async function cancelInvoice(id: string) {
    toast.warning("Cancel this invoice?", {
      description: "This action cannot be undone.",
      action: {
        label: "Confirm",
        onClick: async () => {
          setActionLoading(id);
          const res = await fetch(`/api/invoices/${id}/cancel`, { method: "PATCH" });
          if (res.ok) {
            await fetchInvoices();
            toast.success("Invoice cancelled");
          }
          setActionLoading(null);
        },
      },
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-[550] tracking-[-0.02em] text-white">Invoices</h1>
          <p className="mt-1 text-[13px] text-[#62666d]">Create and manage client invoices.</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-[13px] font-[500] text-black hover:bg-neutral-200"
        >
          <Plus className="h-4 w-4" /> New invoice
        </Button>
      </div>

      {/* Stats */}
      {!loading && invoices.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard icon={DollarSign} label="Invoiced this month" value={fmt(totalThisMonth)} />
          <StatCard icon={AlertTriangle} label="Unpaid" value={`${unpaid.length} · ${fmt(unpaidTotal)}`} />
          <StatCard icon={CheckCircle2} label="Paid" value={paidCount.toString()} />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-[#62666d]" />
        </div>
      )}

      {/* Empty */}
      {!loading && invoices.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#1a1c20] bg-[#0c0d0e]/50 p-16 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#14161a]">
            <Receipt className="h-5 w-5 text-[#62666d]" />
          </div>
          <p className="text-[14px] font-[520] text-[#8a8f98]">No invoices yet</p>
          <p className="mt-1 text-[13px] text-[#62666d]">
            Create your first invoice or generate one from an accepted proposal.
          </p>
          <Button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-[13px] font-[500] text-black hover:bg-neutral-200"
          >
            <Plus className="h-3.5 w-3.5" /> New invoice
          </Button>
        </div>
      )}

      {/* Table */}
      {!loading && invoices.length > 0 && (
        <div className="rounded-lg border border-[#1a1c20] bg-[#0c0d0e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1c20]">
                <th className="px-4 py-3 text-left text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45]">Invoice #</th>
                <th className="px-4 py-3 text-left text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45]">Client</th>
                <th className="hidden px-4 py-3 text-right text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45] md:table-cell">Amount</th>
                <th className="px-4 py-3 text-left text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45]">Status</th>
                <th className="hidden px-4 py-3 text-right text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45] md:table-cell">Due</th>
                <th className="hidden px-4 py-3 text-right text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45] sm:table-cell">Created</th>
                <th className="px-4 py-3 text-right text-[11px] font-[500] uppercase tracking-wider text-[#3a3f45]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const badge = STATUS_STYLES[inv.status] || STATUS_STYLES.unpaid;
                const overdue = isOverdue(inv);
                return (
                  <tr key={inv.id} className="border-b border-[#1a1c20] last:border-b-0">
                    <td className="px-4 py-3 text-[13px] font-mono text-[#8a8f98]">{inv.invoice_number}</td>
                    <td className="px-4 py-3">
                      <div className="text-[14px] text-white">{inv.client_name}</div>
                      {inv.status === "payment_claimed" && (
                        <div className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-green-500/10 px-2 py-0.5 text-[11px] font-[500] text-green-400">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                          </span>
                          Client reported payment — confirm below
                        </div>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-[13px] text-[#8a8f98] md:table-cell">{fmt(inv.total_cents, inv.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-[500] ${badge.cls}`}>{badge.label}</span>
                      {overdue && <span className="ml-1.5 text-[10px] font-[500] text-red-400">Overdue</span>}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-[12px] text-[#3a3f45] md:table-cell">
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-[12px] text-[#3a3f45] sm:table-cell">
                      {new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/i/${inv.hosted_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#3a3f45] hover:bg-[#14161a] hover:text-[#8a8f98] transition-colors"
                          title="View"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        {isActionable(inv) && (
                          <>
                            <button
                              onClick={() => setEditTarget(inv)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#3a3f45] hover:bg-[#14161a] hover:text-[#8a8f98] transition-colors"
                              title="Edit invoice"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => markPaid(inv.id)}
                              disabled={actionLoading === inv.id}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-green-500/50 hover:bg-green-500/10 hover:text-green-400 transition-colors disabled:opacity-50"
                              title="Mark paid"
                            >
                              {actionLoading === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => cancelInvoice(inv.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#3a3f45] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <NewInvoiceModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchInvoices(); }}
          proposals={proposals}
          profileData={profileData}
        />
      )}

      {/* Edit Invoice Modal */}
      {editTarget && (
        <EditInvoiceModal
          invoice={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); fetchInvoices(); }}
        />
      )}
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#1a1c20] bg-[#0c0d0e] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-[500] uppercase tracking-wide text-[#62666d]">{label}</p>
        <Icon className="h-4 w-4 text-[#3a3f45]" />
      </div>
      <p className="mt-3 text-[22px] font-[600] tracking-[-0.03em] text-white leading-none">{value}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   New Invoice Modal
   ═══════════════════════════════════════════════════════════════ */
function NewInvoiceModal({ onClose, onCreated, proposals, profileData }: {
  onClose: () => void;
  onCreated: () => void;
  proposals: { id: string; client_name: string; client_email: string; project_title: string }[];
  profileData: { email: string; default_payment_instructions: string } | null;
}) {
  const defaultNote = profileData
    ? `Payment is due within the specified due date. Late payments may be subject to additional fees. For questions, contact ${profileData.email || 'us'} or reply to the invoice notification email.`
    : '';

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([{ label: "", amount_cents: 0 }]);
  const [note, setNote] = useState(defaultNote);
  const [dueDate, setDueDate] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState(profileData?.default_payment_instructions || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedProposalId, setSelectedProposalId] = useState("");

  const total = lineItems.reduce((s, i) => s + (i.amount_cents || 0), 0);

  function updateItem(idx: number, field: keyof InvoiceLineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  }

  function removeItem(idx: number) {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!clientName.trim()) { setError("Client name is required"); return; }
    if (!clientEmail.trim()) { setError("Client email is required"); return; }
    if (lineItems.some((i) => !i.label.trim())) { setError("All line items need a description"); return; }
    if (total <= 0) { setError("Total must be greater than 0"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName.trim(),
          client_email: clientEmail.trim(),
          line_items: lineItems,
          total_cents: total,
          currency: "USD",
          note: note.trim() || null,
          due_date: dueDate || null,
          payment_method: "manual",
          payment_instructions: paymentInstructions.trim() || null,
          proposal_id: selectedProposalId || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to create invoice");
        return;
      }
      onCreated();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[#23252a] bg-[#0f1011] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-[#62666d] hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-[18px] font-[550] text-white mb-1">New Invoice</h2>
        <p className="text-[13px] text-[#62666d] mb-5">Create and share with your client.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Link to proposal (optional) */}
          {proposals.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Link to proposal <span className="text-[#3a3f45]">(optional)</span></Label>
              <select
                value={selectedProposalId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setSelectedProposalId(pid);
                  if (pid) {
                    const p = proposals.find((p) => p.id === pid);
                    if (p) {
                      setClientName(p.client_name || "");
                      setClientEmail(p.client_email || "");
                    }
                  }
                }}
                className="w-full h-9 rounded-md border border-[#23252a] bg-[#08090a] px-2.5 text-[13px] text-white focus:border-[#3a3f45] focus:ring-0 outline-none appearance-none"
              >
                <option value="">None — standalone invoice</option>
                {proposals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_title} — {p.client_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Client info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Client name *</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Inc"
                className="h-9 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Client email *</Label>
              <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@example.com" type="email"
                className="h-9 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0" />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-1.5">
            <Label className="text-[12px] text-[#8a8f98]">Line items</Label>
            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={item.label}
                    onChange={(e) => updateItem(idx, "label", e.target.value)}
                    placeholder="Description"
                    className="h-9 flex-1 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#62666d]">$</span>
                    <AmountInput
                      cents={item.amount_cents}
                      onChange={(cents) => updateItem(idx, "amount_cents", cents)}
                    />
                  </div>
                  {lineItems.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-[#3a3f45] hover:text-red-400 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLineItems((prev) => [...prev, { label: "", amount_cents: 0 }])}
              className="mt-1 text-[12px] text-[#62666d] hover:text-white transition-colors"
            >
              + Add line item
            </button>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-md border border-[#23252a] bg-[#08090a] px-4 py-3">
            <span className="text-[13px] font-[500] text-[#8a8f98]">Total</span>
            <span className="text-[16px] font-[600] text-white">{fmt(total)}</span>
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <Label className="text-[12px] text-[#8a8f98]">Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="h-9 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white focus:border-[#3a3f45] focus:ring-0" />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-[12px] text-[#8a8f98]">Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Payment terms, thank-you message, or additional context…"
              className="rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0 resize-none"
            />
          </div>

          {/* Payment instructions */}
          <div className="space-y-1.5">
            <Label className="text-[12px] text-[#8a8f98]">Payment instructions</Label>
            <Textarea
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              rows={3}
              placeholder="e.g. UPI: yourname@upi | PayPal: you@email.com | Bank: HDFC 1234567890 IFSC: HDFC0001"
              className="rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0 resize-none"
            />
          </div>

          {error && <p className="text-[13px] text-red-400">{error}</p>}

          <Button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-white py-2.5 text-[13px] font-[500] text-black hover:bg-neutral-200 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Create invoice"}
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Edit Invoice Modal
   ═══════════════════════════════════════════════════════════════ */
function EditInvoiceModal({ invoice, onClose, onSaved }: { invoice: Invoice; onClose: () => void; onSaved: () => void }) {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    invoice.line_items.map((i) => ({ ...i }))
  );
  const [note, setNote] = useState(invoice.note || "");
  const [dueDate, setDueDate] = useState(invoice.due_date || "");
  const [paymentInstructions, setPaymentInstructions] = useState(invoice.payment_instructions || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = lineItems.reduce((s, i) => s + (i.amount_cents || 0), 0);

  function updateItem(idx: number, field: keyof InvoiceLineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  }

  function removeItem(idx: number) {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (lineItems.some((i) => !i.label.trim())) { setError("All line items need a description"); return; }
    if (total <= 0) { setError("Total must be greater than 0"); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_items: lineItems,
          total_cents: total,
          note: note.trim() || null,
          due_date: dueDate || null,
          payment_instructions: paymentInstructions.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to update invoice");
        return;
      }
      onSaved();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function fmt(cents: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[#23252a] bg-[#0f1011] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-[#62666d] hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-[18px] font-[550] text-white mb-1">Edit Invoice</h2>
        <p className="text-[13px] text-[#62666d] mb-5">
          {invoice.invoice_number} · {invoice.client_name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Line items */}
          <div className="space-y-1.5">
            <Label className="text-[12px] text-[#8a8f98]">Line items</Label>
            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={item.label}
                    onChange={(e) => updateItem(idx, "label", e.target.value)}
                    placeholder="Description"
                    className="h-9 flex-1 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[#62666d]">$</span>
                    <AmountInput
                      cents={item.amount_cents}
                      onChange={(cents) => updateItem(idx, "amount_cents", cents)}
                    />
                  </div>
                  {lineItems.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-[#3a3f45] hover:text-red-400 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLineItems((prev) => [...prev, { label: "", amount_cents: 0 }])}
              className="mt-1 text-[12px] text-[#62666d] hover:text-white transition-colors"
            >
              + Add line item
            </button>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-md border border-[#23252a] bg-[#08090a] px-4 py-3">
            <span className="text-[13px] font-[500] text-[#8a8f98]">Total</span>
            <span className="text-[16px] font-[600] text-white">{fmt(total)}</span>
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <Label className="text-[12px] text-[#8a8f98]">Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="h-9 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white focus:border-[#3a3f45] focus:ring-0" />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-[12px] text-[#8a8f98]">Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Payment terms, thank-you message, or additional context…"
              className="rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0 resize-none"
            />
          </div>

          {/* Payment instructions */}
          <div className="space-y-1.5">
            <Label className="text-[12px] text-[#8a8f98]">Payment instructions</Label>
            <Textarea
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              rows={3}
              placeholder="e.g. UPI: yourname@upi | PayPal: you@email.com"
              className="rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0 resize-none"
            />
          </div>

          {error && <p className="text-[13px] text-red-400">{error}</p>}

          <Button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-white py-2.5 text-[13px] font-[500] text-black hover:bg-neutral-200 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ── Amount Input (fixes cursor-jump issue) ────────────────── */
function AmountInput({ cents, onChange }: { cents: number; onChange: (c: number) => void }) {
  const [raw, setRaw] = useState(() => (cents ? (cents / 100).toString() : ""));
  const prevCents = useRef(cents);

  // Sync from parent only when cents changes externally (e.g. restore)
  useEffect(() => {
    if (cents !== prevCents.current) {
      setRaw(cents ? (cents / 100).toString() : "");
      prevCents.current = cents;
    }
  }, [cents]);

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={raw}
      onChange={(e) => {
        const v = e.target.value;
        // Allow only digits and one decimal point
        if (/^\d*\.?\d{0,2}$/.test(v) || v === "") {
          setRaw(v);
          const parsed = parseFloat(v || "0");
          const newCents = Math.round(parsed * 100);
          prevCents.current = newCents;
          onChange(newCents);
        }
      }}
      placeholder="0.00"
      className="h-9 rounded-md border border-[#23252a] bg-[#08090a] pl-6 text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
    />
  );
}
