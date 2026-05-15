"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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

        {sent ? (
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-[20px] font-[520] tracking-[-0.01em] text-white">
              Check your email
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#8a8f98]">
              We sent a password reset link to{" "}
              <span className="text-white">{email}</span>. Click the link in the
              email to choose a new password.
            </p>
            <p className="mt-4 text-[12px] text-[#62666d]">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                onClick={() => setSent(false)}
                className="text-white hover:underline"
              >
                try again
              </button>
              .
            </p>
            <Link
              href="/login"
              className="mt-6 block text-[13px] text-[#62666d] hover:text-[#8a8f98]"
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="mb-6 text-center">
              <h1 className="text-[20px] font-[520] tracking-[-0.01em] text-white">
                Reset your password
              </h1>
              <p className="mt-1 text-[13px] text-[#8a8f98]">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-1">
                <Label className="text-[12px] text-[#8a8f98]">Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
                />
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
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-[13px] text-[#62666d]">
              Remember your password?{" "}
              <Link href="/login" className="text-white hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
