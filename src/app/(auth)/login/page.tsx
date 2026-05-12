"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08090a] px-4">
      {/* 🔥 CARD CONTAINER */}
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
            Welcome back
          </h1>
          <p className="mt-1 text-[13px] text-[#8a8f98]">
            Sign in to your account
          </p>
        </div>

        {/* Google OAuth */}
        <Button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          variant="ghost"
          className="mb-4 flex h-10 w-full items-center justify-center gap-3 rounded-md border border-[#23252a] bg-[#08090a] text-[13px] font-[500] text-[#8a8f98] hover:bg-[#14161a] hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#23252a]" />
          <span className="text-[11px] tracking-wide text-[#62666d]">OR</span>
          <div className="h-px flex-1 bg-[#23252a]" />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Email */}
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

          {/* Password */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[12px] text-[#8a8f98]">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-[12px] text-[#62666d] hover:text-[#8a8f98]"
              >
                Forgot?
              </Link>
            </div>

            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 rounded-md border border-[#23252a] bg-[#08090a] text-[14px] text-white placeholder:text-[#62666d] focus:border-[#3a3f45] focus:ring-0"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
              {error}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-10 w-full rounded-md bg-white text-[13px] font-[500] text-black hover:bg-neutral-200"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-[13px] text-[#62666d]">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-white hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}