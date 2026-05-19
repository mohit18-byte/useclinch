"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClientSelect } from "@/components/clients/client-select";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  X,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/lib/currencies";

const PROJECT_TYPES = [
  "Website",
  "Web App",
  "Mobile App",
  "Landing Page",
  "E-commerce",
  "API",
  "Other",
];

const TONES = [
  { value: "formal", label: "Formal", desc: "Professional, corporate tone" },
  { value: "friendly", label: "Friendly", desc: "Warm, approachable tone" },
  { value: "bold", label: "Bold", desc: "Confident, direct tone" },
] as const;

type InputMode = "quick" | "paste";

export default function NewProposalPage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("quick");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client
  const [client, setClient] = useState<{
    id: string;
    name: string;
    email: string | null;
    company: string | null;
  } | null>(null);
  const [clientName, setClientName] = useState("");

  // Quick fill fields
  const [projectType, setProjectType] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [timeline, setTimeline] = useState("");

  // Paste JD
  const [jobDescription, setJobDescription] = useState("");

  // Tone
  const [tone, setTone] = useState<"formal" | "friendly" | "bold">("formal");

  // Currency (pre-filled from profile default)
  const [currency, setCurrency] = useState("USD");

  // Pricing mode
  const [pricingMode, setPricingMode] = useState<"fixed" | "hourly" | "estimate">("estimate");
  const [budget, setBudget] = useState("");       // used when pricingMode = "fixed"
  const [hourlyRate, setHourlyRate] = useState(""); // used when pricingMode = "hourly"

  // Pre-load default currency from profile
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((p) => { if (p?.default_currency) setCurrency(p.default_currency); })
      .catch(() => {});
  }, []);

  const resolvedClientName = client?.name || clientName;

  function addDeliverable() {
    const trimmed = tagInput.trim();
    if (trimmed && !deliverables.includes(trimmed)) {
      setDeliverables((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  // Pricing validation: budget/rate required only when relevant mode is selected
  const pricingValid =
    pricingMode === "estimate" ||
    (pricingMode === "fixed" && budget.trim() !== "" && parseFloat(budget) > 0) ||
    (pricingMode === "hourly" && hourlyRate.trim() !== "" && parseFloat(hourlyRate) > 0);

  const canGenerate =
    resolvedClientName.trim() &&
    (mode === "paste" ? jobDescription.trim() : projectType) &&
    pricingValid;

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client?.id || null,
          client_name: resolvedClientName,
          client_email: client?.email || null,
          client_company: client?.company || null,
          project_type: projectType || null,
          deliverables,
          timeline: timeline || null,
          tone,
          currency,
          pricing_mode: pricingMode,
          budget: pricingMode === "fixed" ? budget : undefined,
          hourly_rate: pricingMode === "hourly" ? hourlyRate : undefined,
          job_description: mode === "paste" ? jobDescription : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.code === "LIMIT_EXCEEDED") {
          setError(err.error);
          return;
        }
        setError(err.error || "Generation failed. Please try again.");
        return;
      }

      const proposal = await res.json();
      router.push(`/proposals/${proposal.id}/edit`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/proposals"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#62666d] transition-colors hover:bg-[#14161a] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[22px] font-[550] tracking-[-0.02em] text-white">
            New Proposal
          </h1>
          <p className="text-[13px] text-[#62666d]">
            Fill in the details and let AI generate your proposal.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Client Selection */}
        <div className="rounded-lg border border-[#1a1c20] bg-[#0c0d0e] p-5">
          <h2 className="mb-3 text-[13px] font-[520] text-[#8a8f98]">
            Client
          </h2>
          <div className="space-y-3">
            <ClientSelect value={client} onChange={setClient} />
            {!client && (
              <div className="space-y-1.5">
                <Label className="text-[12px] text-[#62666d]">
                  Or type a name
                </Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client name"
                  className="h-10 rounded-md border border-[#1a1c20] bg-[#08090a] text-[14px] text-white placeholder:text-[#3a3f45] focus:border-[#23252a] focus:ring-0"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Currency & Pricing (always visible) ─────────────── */}
        <div className="rounded-lg border border-[#1a1c20] bg-[#0c0d0e] p-5 space-y-5">
          <h2 className="text-[13px] font-[520] text-[#8a8f98]">Currency & Pricing</h2>

          {/* Currency picker */}
          <div className="space-y-2">
            <Label className="text-[12px] text-[#62666d]">Currency</Label>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrency(c.code)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-[520] transition-all border ${
                    currency === c.code
                      ? "border-[#5e6ad2] bg-[#5e6ad2]/10 text-[#818cf8]"
                      : "border-[#1a1c20] bg-[#08090a] text-[#8a8f98] hover:border-[#23252a] hover:text-white"
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.code}</span>
                  <span className={`text-[10px] ${currency === c.code ? "text-[#818cf8]/60" : "text-[#3a3f45]"}`}>{c.symbol}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pricing mode toggle */}
          <div className="space-y-2">
            <Label className="text-[12px] text-[#62666d]">How would you like to price this proposal?</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: "fixed" as const, label: "Fixed Budget", desc: "Client has a set budget" },
                { mode: "hourly" as const, label: "Bill Hourly", desc: "Enter your rate per hour" },
                { mode: "estimate" as const, label: "AI Estimate", desc: "Let AI suggest a price" },
              ].map((opt) => (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setPricingMode(opt.mode)}
                  className={`rounded-md border p-3 text-left transition-all ${
                    pricingMode === opt.mode
                      ? "border-[#5e6ad2] bg-[#5e6ad2]/10"
                      : "border-[#1a1c20] bg-[#08090a] hover:border-[#23252a]"
                  }`}
                >
                  <p className={`text-[12px] font-[560] ${pricingMode === opt.mode ? "text-[#818cf8]" : "text-[#8a8f98]"}`}>
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#3a3f45] leading-snug">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional input — fixed budget */}
          {pricingMode === "fixed" && (
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#62666d]">
                Client budget <span className="text-red-400">*</span>
                <span className="ml-1 text-[#3a3f45]">— the total the client is willing to pay</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#3a3f45]">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="500000"
                  className="h-9 rounded-md border border-[#1a1c20] bg-[#08090a] pl-7 text-[13px] text-white placeholder:text-[#3a3f45] focus:border-[#23252a] focus:ring-0"
                />
              </div>
              <p className="text-[11px] text-[#3a3f45]">AI will scope deliverables to fit exactly this amount.</p>
            </div>
          )}

          {/* Conditional input — hourly rate */}
          {pricingMode === "hourly" && (
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#62666d]">
                Your rate for this project <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#3a3f45]">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="3000"
                  className="h-9 rounded-md border border-[#1a1c20] bg-[#08090a] pl-7 text-[13px] text-white placeholder:text-[#3a3f45] focus:border-[#23252a] focus:ring-0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#3a3f45]">/hr</span>
              </div>
              <p className="text-[11px] text-[#3a3f45]">AI will estimate hours × your rate and show the math in the proposal.</p>
            </div>
          )}

          {/* AI estimate — no input needed */}
          {pricingMode === "estimate" && (
            <p className="rounded-md border border-[#1a1c20] bg-[#08090a] px-3 py-2.5 text-[12px] text-[#62666d]">
              AI will research a fair market rate in <span className="text-[#818cf8]">{currency}</span> for this type of project and explain its assumption in the proposal.
            </p>
          )}
        </div>

        {/* Input Mode Toggle */}
        <div className="rounded-lg border border-[#1a1c20] bg-[#0c0d0e] p-5">
          <div className="mb-4 flex rounded-md border border-[#1a1c20] bg-[#08090a] p-0.5">
            <button
              onClick={() => setMode("quick")}
              className={`flex-1 rounded-[5px] px-3 py-2 text-[13px] font-[520] transition-all ${
                mode === "quick"
                  ? "bg-[#1a1c20] text-white"
                  : "text-[#62666d] hover:text-[#8a8f98]"
              }`}
            >
              Quick Fill
            </button>
            <button
              onClick={() => setMode("paste")}
              className={`flex-1 rounded-[5px] px-3 py-2 text-[13px] font-[520] transition-all ${
                mode === "paste"
                  ? "bg-[#1a1c20] text-white"
                  : "text-[#62666d] hover:text-[#8a8f98]"
              }`}
            >
              Paste Job Description
            </button>
          </div>

          {mode === "quick" ? (
            <div className="space-y-4">
              {/* Project Type */}
              <div className="space-y-1.5">
                <Label className="text-[12px] text-[#8a8f98]">
                  Project type <span className="text-red-400">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setProjectType(type)}
                      className={`rounded-md px-3 py-1.5 text-[12px] font-[500] transition-all ${
                        projectType === type
                          ? "bg-white text-black"
                          : "border border-[#1a1c20] bg-[#08090a] text-[#8a8f98] hover:border-[#23252a] hover:text-white"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deliverables */}
              <div className="space-y-1.5">
                <Label className="text-[12px] text-[#8a8f98]">Key deliverables</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDeliverable();
                      }
                    }}
                    placeholder="e.g. Admin dashboard"
                    className="h-9 flex-1 rounded-md border border-[#1a1c20] bg-[#08090a] text-[13px] text-white placeholder:text-[#3a3f45] focus:border-[#23252a] focus:ring-0"
                  />
                  <Button
                    type="button"
                    onClick={addDeliverable}
                    className="h-9 rounded-md border border-[#1a1c20] bg-[#08090a] px-2.5 text-[#62666d] hover:bg-[#14161a] hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {deliverables.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {deliverables.map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1 text-[12px] text-[#8a8f98]"
                      >
                        {d}
                        <button
                          onClick={() =>
                            setDeliverables((prev) =>
                              prev.filter((x) => x !== d)
                            )
                          }
                          className="text-[#3a3f45] hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-1.5">
                <Label className="text-[12px] text-[#8a8f98]">Timeline <span className="text-[#3a3f45]">(optional)</span></Label>
                <Input
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="e.g. 6 weeks"
                  className="h-9 rounded-md border border-[#1a1c20] bg-[#08090a] text-[13px] text-white placeholder:text-[#3a3f45] focus:border-[#23252a] focus:ring-0"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] text-[#8a8f98]">
                  Job description <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={8}
                  placeholder="Paste the full job description here. AI will extract scope and deliverables automatically. Your pricing settings above override any budget mentioned in the JD."
                  className="rounded-md border border-[#1a1c20] bg-[#08090a] text-[13px] text-white placeholder:text-[#3a3f45] focus:border-[#23252a] focus:ring-0 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] text-[#8a8f98]">Timeline <span className="text-[#3a3f45]">(optional)</span></Label>
                <Input
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="e.g. 6 weeks"
                  className="h-9 rounded-md border border-[#1a1c20] bg-[#08090a] text-[13px] text-white placeholder:text-[#3a3f45] focus:border-[#23252a] focus:ring-0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tone Selector */}
        <div className="rounded-lg border border-[#1a1c20] bg-[#0c0d0e] p-5">
          <h2 className="mb-3 text-[13px] font-[520] text-[#8a8f98]">Tone</h2>
          <div className="grid grid-cols-3 gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={`rounded-md border p-3 text-left transition-all ${
                  tone === t.value
                    ? "border-white/20 bg-white/[0.04]"
                    : "border-[#1a1c20] bg-[#08090a] hover:border-[#23252a]"
                }`}
              >
                <p
                  className={`text-[13px] font-[520] ${
                    tone === t.value ? "text-white" : "text-[#8a8f98]"
                  }`}
                >
                  {t.label}
                </p>
                <p className="mt-0.5 text-[11px] text-[#62666d]">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-[14px] font-[520] text-black transition-colors hover:bg-neutral-200 disabled:opacity-40"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating proposal...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Proposal
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
