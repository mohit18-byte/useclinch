"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Upload, Save, Loader2 } from "lucide-react";

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
}

export default function SettingsProfilePage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);

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

            <div className="space-y-1.5">
              <Label className="text-[12px] text-[#8a8f98]">
                Hourly rate (USD)
              </Label>
              <div className="relative max-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#62666d]">
                  $
                </span>
                <Input
                  type="number"
                  value={
                    profile.hourly_rate != null
                      ? (profile.hourly_rate / 100).toString()
                      : ""
                  }
                  onChange={(e) =>
                    update({
                      hourly_rate: e.target.value
                        ? Math.round(parseFloat(e.target.value) * 100)
                        : null,
                    })
                  }
                  placeholder="100"
                  className="h-10 rounded-md border border-[#23252a] bg-[#08090a] pl-7 text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
                />
              </div>
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
