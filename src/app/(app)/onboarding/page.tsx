"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Check, ArrowRight, ArrowLeft, Upload } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */
interface ProfileData {
  full_name: string;
  professional_title: string;
  bio: string;
  services: string[];
  hourly_rate: string;
  brand_color: string;
  logo_url: string | null;
}

/* ── Step indicator ────────────────────────────────────────── */
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i <= current ? "bg-white" : "bg-[#23252a]"
          }`}
        />
      ))}
    </div>
  );
}

/* ── Step 1: Name + Bio ────────────────────────────────────── */
function Step1({
  data,
  onChange,
}: {
  data: ProfileData;
  onChange: (d: Partial<ProfileData>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[20px] font-[520] text-white">
          Let&apos;s start with the basics
        </h2>
        <p className="mt-1 text-[13px] text-[#8a8f98]">
          This appears on your proposals and invoices.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-[#8a8f98]">Full name</Label>
        <Input
          placeholder="John Doe"
          value={data.full_name}
          onChange={(e) => onChange({ full_name: e.target.value })}
          className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-[#8a8f98]">Professional title</Label>
        <Input
          placeholder="e.g. Full-Stack Developer, UI/UX Designer"
          value={data.professional_title}
          onChange={(e) => onChange({ professional_title: e.target.value })}
          className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-[#8a8f98]">
          Professional bio{" "}
          <span className="text-[#62666d]">(2-3 sentences)</span>
        </Label>
        <Textarea
          placeholder="Full-stack developer specialising in React and Node.js. I build production-ready web apps for startups and agencies."
          value={data.bio}
          onChange={(e) => onChange({ bio: e.target.value })}
          rows={3}
          className="rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0 resize-none"
        />
      </div>
    </div>
  );
}

/* ── Step 2: Services + Rate ───────────────────────────────── */
function Step2({
  data,
  onChange,
}: {
  data: ProfileData;
  onChange: (d: Partial<ProfileData>) => void;
}) {
  const [tagInput, setTagInput] = useState("");

  function addService() {
    const trimmed = tagInput.trim();
    if (trimmed && !data.services.includes(trimmed)) {
      onChange({ services: [...data.services, trimmed] });
    }
    setTagInput("");
  }

  function removeService(service: string) {
    onChange({ services: data.services.filter((s) => s !== service) });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addService();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[20px] font-[520] text-white">
          What do you do?
        </h2>
        <p className="mt-1 text-[13px] text-[#8a8f98]">
          Add your services and set your hourly rate.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-[#8a8f98]">
          Services{" "}
          <span className="text-[#62666d]">(press Enter to add)</span>
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Web Development"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-10 flex-1 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
          />
          <Button
            type="button"
            onClick={addService}
            className="h-10 rounded-md border border-[#23252a] bg-[#08090a] px-3 text-[#8a8f98] hover:bg-[#14161a] hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {data.services.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.services.map((service) => (
              <span
                key={service}
                className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.05] px-2.5 py-1 text-[12px] font-[500] text-[#8a8f98]"
              >
                {service}
                <button
                  onClick={() => removeService(service)}
                  className="text-[#62666d] hover:text-white transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12px] text-[#8a8f98]">
          Hourly rate (USD)
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#62666d]">
            $
          </span>
          <Input
            type="number"
            placeholder="100"
            value={data.hourly_rate}
            onChange={(e) => onChange({ hourly_rate: e.target.value })}
            className="h-10 rounded-md border border-[#23252a] bg-[#08090a] pl-7 text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Step 3: Logo + Brand color ────────────────────────────── */
function Step3({
  data,
  onChange,
}: {
  data: ProfileData;
  onChange: (d: Partial<ProfileData>) => void;
}) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      alert("Only PNG and JPG files are accepted.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("File must be under 2MB.");
      return;
    }

    // Preview immediately
    setLogoPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Upload failed");
        setLogoPreview(null);
        return;
      }

      const { url } = await res.json();
      onChange({ logo_url: url });
    } catch {
      alert("Upload failed. Please try again.");
      setLogoPreview(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[20px] font-[520] text-white">
          Brand your proposals
        </h2>
        <p className="mt-1 text-[13px] text-[#8a8f98]">
          Your logo and brand color appear on every PDF.
        </p>
      </div>

      {/* Logo upload */}
      <div className="space-y-1.5">
        <Label className="text-[12px] text-[#8a8f98]">Logo</Label>
        <label className="flex h-28 cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#23252a] bg-[#08090a] transition-colors hover:border-[#3a3f45]">
          {logoPreview || data.logo_url ? (
            <img
              src={logoPreview || data.logo_url || ""}
              alt="Logo preview"
              className="h-16 w-16 rounded-lg object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-[#62666d]">
              <Upload className="h-5 w-5" />
              <span className="text-[12px]">
                {uploading ? "Uploading..." : "PNG or JPG, max 2MB"}
              </span>
            </div>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Brand color */}
      <div className="space-y-1.5">
        <Label className="text-[12px] text-[#8a8f98]">Brand color</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={data.brand_color}
            onChange={(e) => onChange({ brand_color: e.target.value })}
            className="h-10 w-10 cursor-pointer rounded-md border border-[#23252a] bg-transparent p-0.5"
          />
          <Input
            value={data.brand_color}
            onChange={(e) => onChange({ brand_color: e.target.value })}
            placeholder="#5e6ad2"
            maxLength={7}
            className="h-10 w-28 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white font-mono placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
          />
          <div
            className="h-10 flex-1 rounded-md border border-[#23252a]"
            style={{ backgroundColor: data.brand_color }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Step 4: Review ────────────────────────────────────────── */
function Step4({ data }: { data: ProfileData }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[20px] font-[520] text-white">
          Looking good ✨
        </h2>
        <p className="mt-1 text-[13px] text-[#8a8f98]">
          Review your profile before we get started.
        </p>
      </div>

      <div className="space-y-4">
        {/* Name + Bio */}
        <div className="rounded-lg border border-[#23252a] bg-[#0f1011] p-4">
          <p className="text-[12px] text-[#62666d] mb-1">Name</p>
          <p className="text-[14px] text-white">{data.full_name || "—"}</p>
          <p className="text-[12px] text-[#62666d] mt-3 mb-1">Title</p>
          <p className="text-[14px] text-white">{data.professional_title || "—"}</p>
          <p className="text-[12px] text-[#62666d] mt-3 mb-1">Bio</p>
          <p className="text-[13px] text-[#8a8f98] leading-relaxed">
            {data.bio || "—"}
          </p>
        </div>

        {/* Services + Rate */}
        <div className="rounded-lg border border-[#23252a] bg-[#0f1011] p-4">
          <p className="text-[12px] text-[#62666d] mb-2">Services</p>
          <div className="flex flex-wrap gap-1.5">
            {data.services.length > 0
              ? data.services.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[12px] text-[#8a8f98]"
                  >
                    {s}
                  </span>
                ))
              : <span className="text-[13px] text-[#62666d]">—</span>}
          </div>
          <p className="text-[12px] text-[#62666d] mt-3 mb-1">Hourly rate</p>
          <p className="text-[14px] text-white">
            {data.hourly_rate ? `$${data.hourly_rate}/hr` : "—"}
          </p>
        </div>

        {/* Brand */}
        <div className="rounded-lg border border-[#23252a] bg-[#0f1011] p-4">
          <p className="text-[12px] text-[#62666d] mb-2">Brand</p>
          <div className="flex items-center gap-3">
            {data.logo_url ? (
              <img
                src={data.logo_url}
                alt="Logo"
                className="h-10 w-10 rounded-md object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/[0.05] text-[12px] text-[#62666d]">
                —
              </div>
            )}
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-md border border-[#23252a]"
                style={{ backgroundColor: data.brand_color }}
              />
              <span className="text-[13px] font-mono text-[#8a8f98]">
                {data.brand_color}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Onboarding Page
   ═══════════════════════════════════════════════════════════════ */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<ProfileData>({
    full_name: "",
    professional_title: "",
    bio: "",
    services: [],
    hourly_rate: "",
    brand_color: "#5e6ad2",
    logo_url: null,
  });

  function updateData(partial: Partial<ProfileData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  const steps = [
    <Step1 key="1" data={data} onChange={updateData} />,
    <Step2 key="2" data={data} onChange={updateData} />,
    <Step3 key="3" data={data} onChange={updateData} />,
    <Step4 key="4" data={data} />,
  ];

  const canProceed = (() => {
    switch (step) {
      case 0:
        return data.full_name.trim().length > 0;
      case 1:
        return data.services.length > 0;
      case 2:
        return true; // Logo + color are optional
      case 3:
        return true;
      default:
        return false;
    }
  })();

  async function handleComplete() {
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: data.full_name,
          professional_title: data.professional_title || null,
          bio: data.bio,
          services: data.services,
          hourly_rate: data.hourly_rate
            ? Math.round(parseFloat(data.hourly_rate) * 100)
            : null,
          brand_color: data.brand_color,
          logo_url: data.logo_url,
          onboarding_completed: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to save profile.");
        setSaving(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      alert("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* Step bar */}
        <div className="mb-8">
          <StepBar current={step} total={steps.length} />
          <p className="mt-3 text-[12px] text-[#62666d]">
            Step {step + 1} of {steps.length}
          </p>
        </div>

        {/* Current step content */}
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6">
          {steps[step]}
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <Button
              onClick={() => setStep((s) => s - 1)}
              variant="ghost"
              className="flex items-center gap-2 rounded-md text-[13px] text-[#8a8f98] hover:bg-white/[0.03] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="flex items-center gap-2 rounded-md bg-white px-5 text-[13px] font-[500] text-black hover:bg-neutral-200 disabled:opacity-40"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-white px-5 text-[13px] font-[500] text-black hover:bg-neutral-200 disabled:opacity-50"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Looks good, let&apos;s go
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
