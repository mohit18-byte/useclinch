"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

/* ── Mobile-drawer nav links ───────────────────────────────── */
function MobileNavLinks() {
  return (
    <div className="flex flex-col">
      {NAV_LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className="px-3 py-3 text-[15px] font-medium text-[#8a8f98] hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

/* ── Desktop sliding-pill nav ──────────────────────────────── */
function SlidingNav() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [pill, setPill] = React.useState<{ left: number; width: number } | null>(null);

  const handleEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    setPill({ left: rect.left - cRect.left, width: rect.width });
  };

  const handleLeave = () => setPill(null);

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 rounded-full bg-white/6 transition-all duration-200 ease-out"
        style={{
          left: pill ? pill.left : 0,
          width: pill ? pill.width : 0,
          opacity: pill ? 1 : 0,
        }}
      />
      {NAV_LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="relative z-10 px-3 py-1.5 text-[13px] font-medium text-[#8a8f98] transition-colors duration-150 hover:text-white rounded-full"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Navbar
   ═══════════════════════════════════════════════════════════════ */
function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      setAuthReady(true);
    });
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#08090a]/80 backdrop-blur-md border-b border-white/5">
      <nav className="mx-auto flex h-16 max-w-6xl items-center px-4">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-[18px] font-[550] tracking-[-0.02em] text-white">
            Clinch
          </span>
          <span className="text-[14px] text-white/30">/</span>
          <span className="text-[14px] text-white/50">
            for devs
          </span>
        </Link>

        {/* Desktop — sliding nav + auth */}
        <div className="hidden md:flex items-center gap-6 ml-auto">
          <SlidingNav />

          <div className="h-4 w-px bg-white/10" />

          {authReady ? (
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Button
                asChild
                variant="ghost"
                className="text-[13px] font-medium rounded-full px-4 py-1.5 bg-white text-black hover:bg-neutral-200 transition-colors"
              >
                <Link href="/dashboard" className="inline-flex items-center gap-1.5">
                  Dashboard
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className="text-[13px] font-medium text-[#8a8f98] hover:text-white hover:bg-white/6 rounded-full px-3 py-1.5"
                >
                  <Link href="/login">Log in</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="text-[13px] font-medium rounded-full px-4 py-1.5 bg-white text-black hover:bg-neutral-200 transition-colors"
                >
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
          ) : (
            <div className="w-[120px]" />
          )}
        </div>

        {/* Mobile — hamburger */}
        <div className="ml-auto md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#8a8f98] hover:text-white hover:bg-white/6"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[280px] bg-[#0f1011] border-l border-white/6 p-0">
              {/* Required by shadcn for accessibility */}
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>

              <div className="flex flex-col h-full pt-6 px-4 pb-8">
                {/* Logo inside drawer */}
                <span className="mb-8 text-[16px] font-medium text-white px-3">Clinch</span>

                {/* Nav links */}
                <MobileNavLinks />

                {/* Auth */}
                {authReady && (
                <div className="mt-auto flex flex-col gap-2 border-t border-white/6 pt-6">
                  {isLoggedIn ? (
                    <Button
                      asChild
                      className="rounded-full text-[14px] font-medium bg-white text-black hover:bg-neutral-200 transition-colors"
                    >
                      <Link href="/dashboard" className="inline-flex items-center gap-1.5">
                        Dashboard
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start text-[14px] font-medium text-[#8a8f98] hover:text-white hover:bg-white/[0.04]"
                      >
                        <Link href="/login">Log in</Link>
                      </Button>
                      <Button
                        asChild
                        className="rounded-full text-[14px] font-medium bg-white text-black hover:bg-neutral-200 transition-colors"
                      >
                        <Link href="/signup">Sign up free</Link>
                      </Button>
                    </>
                  )}
                </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}


function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface-0">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <div className="flex items-center gap-2">
          {/* <div
            className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold"
            style={{ backgroundColor: AMBER, color: "#08090a" }}
          >
            C
          </div> */}
          <span className="text-[14px] font-[500] text-[#8a8f98]">
            Clinch
            <span className="text-[#62666d]"> / for devs</span>
          </span>
        </div>
        <p className="text-[13px] text-text-quaternary">
          © {new Date().getFullYear()} Clinch. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link
            href="/privacy"
            className="text-[13px] text-text-quaternary hover:text-text-secondary transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-[13px] text-text-quaternary hover:text-text-secondary transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-0">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
