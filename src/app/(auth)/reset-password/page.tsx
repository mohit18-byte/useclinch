"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08090a] px-4">
      <div className="w-full max-w-[360px] rounded-xl border border-[#23252a] bg-[#0f1011] p-7">
        {/* Logo */}
        <Link href="/" className="mb-6 block text-center">
          <span className="text-[20px] font-[550] tracking-[-0.02em] text-white">
            Clinch
          </span>
        </Link>

        {success ? (
          /* ── Success state ── */
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#27a644]/15">
              <svg
                className="h-6 w-6 text-[#27a644]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-[20px] font-[520] tracking-[-0.01em] text-white">
              Password updated
            </h1>
            <p className="mt-2 text-[13px] text-[#8a8f98]">
              Your password has been reset. Redirecting to your dashboard...
            </p>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="mb-6 text-center">
              <h1 className="text-[20px] font-[520] tracking-[-0.01em] text-white">
                Choose a new password
              </h1>
              <p className="mt-1 text-[13px] text-[#8a8f98]">
                Enter your new password below.
              </p>
            </div>

            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div className="space-y-1">
                <Label className="text-[12px] text-[#8a8f98]">
                  New password
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[12px] text-[#8a8f98]">
                  Confirm password
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
                />
                <p className="text-[11px] text-[#62666d]">
                  Minimum 8 characters
                </p>
              </div>

              {error && (
                <p className="rounded-md bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="mt-2 h-10 w-full rounded-md bg-white text-[13px] font-[500] text-black hover:bg-neutral-200"
              >
                {loading ? "Updating..." : "Reset password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
