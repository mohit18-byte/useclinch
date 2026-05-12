"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";

/* ── Nav items ─────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Proposals", href: "/proposals", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Clients", href: "/clients", icon: Users },
];

const BOTTOM_ITEMS = [
  { label: "Settings", href: "/settings/profile", icon: Settings },
];

/* ── Sidebar nav link ──────────────────────────────────────── */
function NavLink({
  item,
  active,
}: {
  item: (typeof NAV_ITEMS)[0];
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-[520] transition-all duration-150 ${active
        ? "bg-[#1a1c20] text-white"
        : "text-[#8a8f98] hover:bg-[#14161a] hover:text-white"
        }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

/* ── Desktop Sidebar ───────────────────────────────────────── */
function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:w-[240px] md:flex-col md:fixed md:inset-y-0 bg-[#08090a]">

      {/* Logo */}
      <div className="flex h-14 items-center px-5 ">
        <Link href="/dashboard" className="flex items-center gap-1.5">
          <span className="text-[16px] font-[550] tracking-[-0.02em] text-white">
            Clinch
          </span>
          <span className="text-[13px] text-[#62666d]">/</span>
          <span className="text-[13px] text-[#8a8f98]">for devs</span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-[#23252a] px-3 py-3 space-y-1">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname.startsWith("/settings")}
          />
        ))}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-[520] text-[#62666d] transition-all hover:bg-[#14161a] hover:text-[#8a8f98]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}

/* ── Mobile Topbar ─────────────────────────────────────────── */
function MobileTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#23252a] bg-[#0f1011] px-4 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-1.5">
        <span className="text-[16px] font-[550] text-white">Clinch</span>
      </Link>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#8a8f98] hover:text-white hover:bg-[#14161a]"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-[260px] bg-[#0f1011] border-l border-[#23252a] p-0"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>

          <div className="flex flex-col h-full pt-6 px-3 pb-6">
            <nav className="flex-1 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={pathname.startsWith(item.href)}
                />
              ))}
            </nav>

            <div className="border-t border-[#23252a] pt-3 space-y-1">
              {BOTTOM_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={pathname.startsWith("/settings")}
                />
              ))}

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-[520] text-[#62666d] hover:bg-[#14161a] hover:text-[#8a8f98]"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Log out
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

/* ── App Layout ────────────────────────────────────────────── */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#08090a]">
      <Sidebar />
      <MobileTopbar />

      {/* 🔥 MAIN AREA */}
      <main className="md:pl-[240px]">
        <div className="h-[calc(100vh-32px)] p-4">

          {/* 🔥 PANEL (Linear-style container) */}
          <div className="h-full rounded-xl border border-[#23252a] bg-[#0f1011] overflow-hidden">

            {/* 🔥 SCROLL AREA */}
            <div className="h-full overflow-y-auto px-6 py-6">
              {children}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}