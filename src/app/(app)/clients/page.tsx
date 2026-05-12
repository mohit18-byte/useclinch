"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Users,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/clients");
    if (res.ok) {
      const data = await res.json();
      setClients(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Open dialog for new or edit
  function openNew() {
    setEditing(null);
    setFormName("");
    setFormEmail("");
    setFormCompany("");
    setDialogOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setFormName(client.name);
    setFormEmail(client.email || "");
    setFormCompany(client.company || "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    setSaving(true);

    try {
      if (editing) {
        // Update
        const res = await fetch(`/api/clients/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            company: formCompany,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setClients((prev) =>
            prev.map((c) => (c.id === editing.id ? updated : c))
          );
        }
      } else {
        // Create
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            company: formCompany,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setClients((prev) => [created, ...prev]);
        }
      }
      setDialogOpen(false);
    } catch {
      alert("Failed to save client.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/clients/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setClients((prev) => prev.filter((c) => c.id !== deleteId));
      }
      setDeleteId(null);
    } catch {
      alert("Failed to delete client.");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-[550] tracking-[-0.02em] text-white">
            Clients
          </h1>
          <p className="mt-1 text-[14px] text-[#8a8f98]">
            Manage your client address book.
          </p>
        </div>
        <Button
          onClick={openNew}
          className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-[13px] font-[500] text-black hover:bg-neutral-200"
        >
          <Plus className="h-4 w-4" />
          Add client
        </Button>
      </div>

      {/* Search */}
      {clients.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#62666d]" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-md border border-[#23252a] bg-[#0f1011] pl-10 text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-[#62666d]" />
        </div>
      )}

      {/* Empty state */}
      {!loading && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#23252a] bg-[#0f1011]/50 p-16 text-center">
          <Users className="mb-3 h-8 w-8 text-[#62666d]" />
          <p className="text-[14px] font-[500] text-[#8a8f98]">
            No clients yet
          </p>
          <p className="mt-1 text-[13px] text-[#62666d]">
            Add your first client to use in proposals and invoices.
          </p>
          <Button
            onClick={openNew}
            className="mt-4 flex items-center gap-2 rounded-md bg-white px-4 py-2 text-[13px] font-[500] text-black hover:bg-neutral-200"
          >
            <Plus className="h-4 w-4" />
            Add client
          </Button>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#23252a]">
                <th className="px-4 py-3 text-left text-[12px] font-[500] text-[#62666d]">
                  Name
                </th>
                <th className="hidden px-4 py-3 text-left text-[12px] font-[500] text-[#62666d] sm:table-cell">
                  Email
                </th>
                <th className="hidden px-4 py-3 text-left text-[12px] font-[500] text-[#62666d] md:table-cell">
                  Company
                </th>
                <th className="hidden px-4 py-3 text-left text-[12px] font-[500] text-[#62666d] md:table-cell">
                  Added
                </th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-[#23252a] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 text-[14px] text-white">
                    {client.name}
                  </td>
                  <td className="hidden px-4 py-3 text-[13px] text-[#8a8f98] sm:table-cell">
                    {client.email || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-[13px] text-[#8a8f98] md:table-cell">
                    {client.company || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-[13px] text-[#62666d] md:table-cell">
                    {new Date(client.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(client)}
                        className="rounded-md p-1.5 text-[#62666d] hover:bg-white/[0.05] hover:text-[#8a8f98] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(client.id)}
                        className="rounded-md p-1.5 text-[#62666d] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No results */}
      {!loading && clients.length > 0 && filtered.length === 0 && (
        <p className="py-10 text-center text-[13px] text-[#62666d]">
          No clients match &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-[#23252a] bg-[#0f1011] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-[520] text-white">
              {editing ? "Edit client" : "Add client"}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#62666d]">
              {editing
                ? "Update this client's details."
                : "Add a new client to your address book."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">
                Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Acme Corp"
                className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Email</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="contact@acme.com"
                className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Company</Label>
              <Input
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="Acme Inc."
                className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                className="rounded-md px-4 py-2 text-[13px] text-[#8a8f98] hover:bg-white/[0.03] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formName.trim() || saving}
                className="rounded-md bg-white px-4 py-2 text-[13px] font-[500] text-black hover:bg-neutral-200 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editing ? (
                  "Save"
                ) : (
                  "Add client"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="border-[#23252a] bg-[#0f1011] sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-[520] text-white">
              Delete client?
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#8a8f98]">
              This will permanently remove this client. Existing proposals and
              invoices referencing this client will not be affected.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteId(null)}
              className="rounded-md px-4 py-2 text-[13px] text-[#8a8f98] hover:bg-white/[0.03] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-2 text-[13px] text-red-400 hover:bg-red-500/20 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
