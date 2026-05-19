"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Upload, Save, Loader2 } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";

interface PastProject {
  name: string;
  description: string;
  link?: string;
}

interface Profile {
  full_name: string;
  professional_title: string;
  bio: string;
  services: string[];
  hourly_rate: number | null;
  brand_color: string;
  logo_url: string | null;
  subscription_tier: string;
  default_payment_instructions: string;
  default_currency: string;
  portfolio_url: string | null;  // single URL
  past_projects: PastProject[];  // structured work history
}

export default function SettingsProfilePage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");
  const [newProject, setNewProject] = useState<{ name: string; description: string; link: string }>({
    name: "",
    description: "",
    link: "",
  });

  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    professional_title: "",
    bio: "",
    services: [],
    hourly_rate: null,
    brand_color: "#5e6ad2",
    logo_url: null,
    subscription_tier: "free",
    default_payment_instructions: "",
    default_currency: "USD",
    portfolio_url: null,
    past_projects: [],
  });

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile({
          full_name: data.full_name || "",
          professional_title: data.professional_title || "",
          bio: data.bio || "",
          services: data.services || [],
          hourly_rate: data.hourly_rate,
          brand_color: data.brand_color || "#5e6ad2",
          logo_url: data.logo_url,
          subscription_tier: data.subscription_tier || "free",
          default_payment_instructions: data.default_payment_instructions || "",
          default_currency: data.default_currency || "USD",
          portfolio_url: data.portfolio_url || null,
          past_projects: Array.isArray(data.past_projects) ? data.past_projects : [],
        });
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  function update(partial: Partial<Profile>) {
    setProfile((p) => ({ ...p, ...partial }));
    setSaved(false);
  }

  // Services tag management
  function addService() {
    const trimmed = tagInput.trim();
    if (trimmed && !profile.services.includes(trimmed)) {
      update({ services: [...profile.services, trimmed] });
    }
    setTagInput("");
  }

  function removeService(service: string) {
    update({ services: profile.services.filter((s) => s !== service) });
  }


  // Past project management — structured { name, description, link }
  function addPastProject() {
    const name = newProject.name.trim();
    const description = newProject.description.trim();
    if (!name || !description) return;
    if (profile.past_projects.length >= 5) return;
    const proj: PastProject = { name, description };
    if (newProject.link.trim()) proj.link = newProject.link.trim();
    update({ past_projects: [...profile.past_projects, proj] });
    setNewProject({ name: "", description: "", link: "" });
  }

  function removePastProject(index: number) {
    update({ past_projects: profile.past_projects.filter((_, i) => i !== index) });
  }

  // Logo upload
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      alert("Only PNG and JPG files are accepted.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("File must be under 2MB.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Upload failed");
        return;
      }

      const { url } = await res.json();
      update({ logo_url: url });
    } catch {
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // Save profile
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profile.full_name,
          professional_title: profile.professional_title || null,
          bio: profile.bio,
          services: profile.services,
          hourly_rate: profile.hourly_rate,
          brand_color: profile.brand_color,
          logo_url: profile.logo_url,
          default_payment_instructions: profile.default_payment_instructions || null,
          default_currency: profile.default_currency || 'USD',
          portfolio_url: profile.portfolio_url || null,
          past_projects: profile.past_projects,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to save.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-[#62666d]" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-[550] tracking-[-0.02em] text-white">
            Profile Settings
          </h1>
          <p className="mt-1 text-[14px] text-[#8a8f98]">
            Update your profile details and branding.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-[13px] font-[500] text-black hover:bg-neutral-200 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <span className="text-green-600">✓ Saved</span>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save changes
            </>
          )}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Name + Bio */}
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6">
          <h2 className="mb-4 text-[14px] font-[520] text-white">
            Personal Information
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Full name</Label>
              <Input
                value={profile.full_name}
                onChange={(e) => update({ full_name: e.target.value })}
                className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">
                Professional title{" "}
                <span className="text-[#62666d]">(shown on proposals)</span>
              </Label>
              <Input
                placeholder="e.g. Independent Developer, UI/UX Designer"
                value={profile.professional_title}
                onChange={(e) => update({ professional_title: e.target.value })}
                className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Bio</Label>
              <Textarea
                value={profile.bio}
                onChange={(e) => update({ bio: e.target.value })}
                rows={3}
                className="rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Services + Rate */}
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6">
          <h2 className="mb-4 text-[14px] font-[520] text-white">
            Services &amp; Pricing
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">
                Services <span className="text-[#62666d]">(Enter to add)</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Web Development"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addService();
                    }
                  }}
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
              {profile.services.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.services.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.05] px-2.5 py-1 text-[12px] font-[500] text-[#8a8f98]"
                    >
                      {s}
                      <button
                        onClick={() => removeService(s)}
                        className="text-[#62666d] hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio & Past Work */}
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6">
          <div className="mb-1">
            <h2 className="text-[14px] font-[520] text-white">Portfolio &amp; Past Work</h2>
            <p className="mt-0.5 text-[12px] text-[#62666d]">
              Portfolio link appears on your hosted proposals. Past projects help the AI write a specific, credible About section.
            </p>
          </div>
          <div className="mt-5 space-y-7">

            {/* Single Portfolio URL */}
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Portfolio / Website URL</Label>
              <Input
                placeholder="https://yourportfolio.com"
                value={profile.portfolio_url || ""}
                onChange={(e) => {
                  update({ portfolio_url: e.target.value || null });
                  if (portfolioError) setPortfolioError("");
                }}
                className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
              />
              {portfolioError && <p className="text-[12px] text-red-400">{portfolioError}</p>}
            </div>

            {/* Past Projects */}
            <div className="space-y-3">
              <div>
                <Label className="text-[12px] text-[#8a8f98]">
                  Past projects{" "}
                  <span className="text-[#62666d]">
                    ({profile.past_projects.length}/5 added — used by AI for your About section)
                  </span>
                </Label>
              </div>

              {/* Add project form */}
              {profile.past_projects.length < 5 && (
                <div className="rounded-lg border border-[#23252a] bg-[#08090a] p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-[#62666d] uppercase tracking-wide">Project name</Label>
                    <Input
                      placeholder="e.g. Clinch — Freelancer SaaS"
                      value={newProject.name}
                      onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
                      className="h-9 rounded-md border border-[#23252a] bg-[#0f1011] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-[#62666d] uppercase tracking-wide">What you built</Label>
                    <Textarea
                      placeholder="e.g. Built a full-stack proposal + invoice SaaS for freelancers using Next.js, Supabase, and Stripe"
                      value={newProject.description}
                      onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
                      rows={2}
                      className="rounded-md border border-[#23252a] bg-[#0f1011] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0 resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-[#62666d] uppercase tracking-wide">
                      Link <span className="normal-case">(optional)</span>
                    </Label>
                    <Input
                      placeholder="https://github.com/you/project or https://live-demo.com"
                      value={newProject.link}
                      onChange={(e) => setNewProject((p) => ({ ...p, link: e.target.value }))}
                      className="h-9 rounded-md border border-[#23252a] bg-[#0f1011] text-[13px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addPastProject}
                    disabled={!newProject.name.trim() || !newProject.description.trim()}
                    className="h-8 rounded-md bg-white/[0.06] px-3 text-[12px] font-[500] text-[#8a8f98] hover:bg-white/[0.1] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-[#23252a]"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add project
                  </Button>
                </div>
              )}

              {/* Project cards */}
              {profile.past_projects.length > 0 && (
                <div className="flex flex-col gap-2">
                  {profile.past_projects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#23252a] bg-[#08090a] px-4 py-3 flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-[510] text-white truncate">{proj.name}</p>
                        <p className="mt-0.5 text-[12px] text-[#62666d] line-clamp-2">{proj.description}</p>
                        {proj.link && (
                          <p className="mt-1 text-[11px] text-[#5e6ad2] truncate">{proj.link}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removePastProject(idx)}
                        className="text-[#62666d] hover:text-white shrink-0 mt-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6">
          <h2 className="mb-4 text-[14px] font-[520] text-white">Branding</h2>
          <div className="space-y-4">
            {/* Logo */}
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Logo</Label>
              <div className="flex items-center gap-4">
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#23252a] bg-[#08090a] transition-colors hover:border-[#3a3f45] shrink-0">
                  {profile.logo_url ? (
                    <img
                      src={profile.logo_url}
                      alt="Logo"
                      className="h-14 w-14 rounded-md object-contain"
                    />
                  ) : (
                    <Upload className="h-5 w-5 text-[#62666d]" />
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <div className="text-[12px] text-[#62666d]">
                  {uploading
                    ? "Uploading..."
                    : "PNG or JPG, max 2MB. Click to replace."}
                </div>
              </div>
            </div>

            {/* Brand color */}
            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">Brand color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={profile.brand_color}
                  onChange={(e) => update({ brand_color: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-md border border-[#23252a] bg-transparent p-0.5"
                />
                <Input
                  value={profile.brand_color}
                  onChange={(e) => update({ brand_color: e.target.value })}
                  maxLength={7}
                  className="h-10 w-28 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white font-mono placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
                />
                <div
                  className="h-10 w-20 rounded-md border border-[#23252a]"
                  style={{ backgroundColor: profile.brand_color }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Default Currency */}
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6">
          <h2 className="mb-1 text-[14px] font-[520] text-white">Default Currency</h2>
          <p className="mb-4 text-[12px] text-[#62666d]">
            Pre-selected when creating new proposals and invoices. You can always change it per document.
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {SUPPORTED_CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => update({ default_currency: c.code })}
                className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-center transition-all ${
                  profile.default_currency === c.code
                    ? 'border-[#5e6ad2] bg-[#5e6ad2]/10'
                    : 'border-[#1a1c20] bg-[#08090a] hover:border-[#23252a]'
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className={`text-[12px] font-[600] ${
                  profile.default_currency === c.code ? 'text-[#818cf8]' : 'text-[#8a8f98]'
                }`}>{c.code}</span>
                <span className="text-[10px] text-[#3a3f45] leading-tight">{c.symbol}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Details */}
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6">
          <h2 className="mb-1 text-[14px] font-[520] text-white">
            Default Payment Instructions
          </h2>
          <p className="mb-4 text-[12px] text-[#62666d]">
            Pre-filled on every new invoice. Your clients will see these on the hosted invoice page.
          </p>
          <Textarea
            value={profile.default_payment_instructions}
            onChange={(e) => update({ default_payment_instructions: e.target.value })}
            rows={4}
            placeholder="e.g. UPI: yourname@upi | PayPal: you@email.com | Bank: HDFC 1234567890 IFSC: HDFC0001"
            className="rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0 resize-none font-mono"
          />
        </div>

        {/* Subscription */}
        <div className="rounded-xl border border-[#23252a] bg-[#0f1011] p-6">
          <h2 className="mb-4 text-[14px] font-[520] text-white">
            Subscription
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] text-white capitalize">
                {profile.subscription_tier} plan
              </p>
              <p className="mt-0.5 text-[13px] text-[#62666d]">
                {profile.subscription_tier === "free"
                  ? "5 AI proposals per month"
                  : "Unlimited proposals"}
              </p>
            </div>
            {profile.subscription_tier === "free" && (
              <Button className="rounded-md bg-white px-4 py-2 text-[13px] font-[500] text-black hover:bg-neutral-200">
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-500/20 bg-[#0f1011] p-6">
          <h2 className="mb-2 text-[14px] font-[520] text-red-400">
            Danger Zone
          </h2>
          <p className="text-[13px] text-[#62666d]">
            Permanently delete your account and all associated data.
          </p>
          <Button
            disabled
            variant="ghost"
            className="mt-4 rounded-md border border-red-500/20 px-4 py-2 text-[13px] text-red-400 opacity-50 cursor-not-allowed"
          >
            Delete account
          </Button>
        </div>
      </div>
    </div>
  );
}
