"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface ClientSelectProps {
  value: Client | null;
  onChange: (client: Client | null) => void;
}

export function ClientSelect({ value, onChange }: ClientSelectProps) {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Add-new dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/clients");
    if (res.ok) {
      const data = await res.json();
      setClients(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) fetchClients();
  }, [open, fetchClients]);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function selectClient(client: Client) {
    onChange(client);
    setOpen(false);
    setSearch("");
  }

  async function handleAddNew() {
    if (!newName.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          company: newCompany,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setClients((prev) => [created, ...prev]);
        onChange(created);
        setAddOpen(false);
        setOpen(false);
        setNewName("");
        setNewEmail("");
        setNewCompany("");
      }
    } catch {
      alert("Failed to create client.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="flex h-10 w-full items-center justify-between rounded-md border border-[#23252a] bg-[#08090a] px-3 text-[14px] font-normal hover:bg-[#14161a]"
          >
            <span className={value ? "text-white" : "text-[#62666d]"}>
              {value ? value.name : "Select a client..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-[#62666d]" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] border-[#23252a] bg-[#0f1011] p-0"
          align="start"
        >
          {/* Search */}
          <div className="border-b border-[#23252a] p-2">
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 rounded-md border-0 bg-[#08090a] text-[13px] text-white placeholder:text-[#62666d] focus:ring-0"
            />
          </div>

          {/* List */}
          <div className="max-h-[200px] overflow-y-auto p-1">
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-[#62666d]" />
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <p className="py-4 text-center text-[13px] text-[#62666d]">
                No clients found.
              </p>
            )}

            {!loading &&
              filtered.map((client) => (
                <button
                  key={client.id}
                  onClick={() => selectClient(client)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] transition-colors hover:bg-white/[0.04]"
                >
                  <Check
                    className={`h-3.5 w-3.5 shrink-0 ${
                      value?.id === client.id
                        ? "text-white"
                        : "text-transparent"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-white">{client.name}</p>
                    {client.email && (
                      <p className="truncate text-[12px] text-[#62666d]">
                        {client.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}
          </div>

          {/* Add new */}
          <div className="border-t border-[#23252a] p-1">
            <button
              onClick={() => {
                setAddOpen(true);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px] text-[#8a8f98] transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add new client
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Add new client dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border-[#23252a] bg-[#0f1011] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-[520] text-white">
              Add client
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#62666d]">
              Add a new client to your address book.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">
                Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Client name"
                className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Email</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="client@company.com"
                className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Company</Label>
              <Input
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Company name"
                className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setAddOpen(false)}
                className="rounded-md px-4 py-2 text-[13px] text-[#8a8f98] hover:bg-white/[0.03] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNew}
                disabled={!newName.trim() || saving}
                className="rounded-md bg-white px-4 py-2 text-[13px] font-[500] text-black hover:bg-neutral-200 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add client"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
