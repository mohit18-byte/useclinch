"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogleSignup() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  /* ✅ SUCCESS STATE */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08090a] px-4">
        <div className="w-full max-w-[360px] rounded-xl border border-[#23252a] bg-[#0f1011] p-7 text-center">
          <Link href="/" className="mb-6 block">
            <span className="text-[20px] font-[550] tracking-[-0.02em] text-white">
              Clinch
            </span>
          </Link>

          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#14161a] mx-auto">
            ✉️
          </div>

          <h1 className="text-[20px] font-[520] text-white">
            Check your email
          </h1>

          <p className="mt-2 text-[13px] text-[#8a8f98]">
            We sent a confirmation link to{" "}
            <span className="text-white">{email}</span>
          </p>

          <Link
            href="/login"
            className="mt-6 inline-block text-[13px] text-[#62666d] hover:text-white"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08090a] px-4">
      {/* 🔥 CARD */}
      <div className="w-full max-w-[360px] rounded-xl border border-[#23252a] bg-[#0f1011] p-7">

        {/* Logo */}
        <Link href="/" className="mb-6 block text-center">
          <span className="text-[20px] font-[550] tracking-[-0.02em] text-white">
            Clinch
          </span>
        </Link>

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-[20px] font-[520] tracking-[-0.01em] text-white">
            Create your account
          </h1>
          <p className="mt-1 text-[13px] text-[#8a8f98]">
            Start winning clients in seconds
          </p>
        </div>

        {/* Google */}
        <Button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          variant="ghost"
          className="mb-4 flex h-10 w-full items-center justify-center gap-3 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] text-[#8a8f98] hover:bg-[#14161a] hover:text-white"
        >
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#23252a]" />
          <span className="text-[11px] text-[#62666d]">OR</span>
          <div className="h-px flex-1 bg-[#23252a]" />
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          {/* Email */}
          <div className="space-y-1">
            <Label className="text-[12px] text-[#8a8f98]">Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label className="text-[12px] text-[#8a8f98]">Password</Label>
            <Input
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
              {error}
            </p>
          )}

          {/* CTA */}
          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-10 w-full rounded-md bg-white text-[13px] text-black hover:bg-neutral-200"
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        {/* Terms */}
        <p className="mt-4 text-center text-[11px] text-[#62666d]">
          By signing up, you agree to our{" "}
          <span className="text-white">Terms</span> and{" "}
          <span className="text-white">Privacy Policy</span>
        </p>

        {/* Footer */}
        <p className="mt-6 text-center text-[13px] text-[#62666d]">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}