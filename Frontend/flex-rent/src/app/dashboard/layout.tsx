"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Bell, Moon, Search, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/admin/ThemeProvider";
import { CustomerSidebar } from "@/components/customer/CustomerSidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = useAuth();
  const { theme, toggleTheme, ready } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("flexrent_customer_sidebar_collapsed");
    if (saved) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  const handleSetCollapsed = (val: boolean) => {
    setCollapsed(val);
    localStorage.setItem("flexrent_customer_sidebar_collapsed", JSON.stringify(val));
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="font-display text-lg font-semibold text-text"
        >
          flexrent
        </Link>

        <div className="hidden flex-1 justify-center px-8 md:flex">
          <div className="relative w-full max-w-md"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-chalk" /><input aria-label="Search rentals" placeholder="Search your rentals" className="w-full rounded-xl border border-border bg-surface-raised py-2 pl-9 pr-4 text-sm text-text outline-none placeholder:text-chalk/70 focus:border-accent/70" /></div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {ready && (
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-chalk transition-colors hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
          <button type="button" aria-label="View notifications" className="relative hidden rounded-lg p-2 text-chalk transition hover:bg-black/5 hover:text-text dark:hover:bg-white/5 sm:block"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" /></button>

          {user && (
            <div className="flex items-center gap-3 border-l border-border pl-3 sm:pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-black">
                {`${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "CU"}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-text">{user.fullName}</p>
                <p className="text-xs text-chalk">Customer</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]"><CustomerSidebar collapsed={collapsed} setCollapsed={handleSetCollapsed} /><main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main></div>
    </div>
  );
}
