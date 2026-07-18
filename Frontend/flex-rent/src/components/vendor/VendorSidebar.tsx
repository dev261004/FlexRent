"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  Palette,
  LogOut,
  Menu,
  X,
  IndianRupee,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/vendor/products", label: "My Products", icon: Package },
  { href: "/vendor/pricelists", label: "Pricelists", icon: Tags },
  { href: "/vendor/operations", label: "Operations", icon: Truck },
  { href: "/vendor/quotations", label: "Quotations", icon: IndianRupee },
];

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-accent text-black"
          : "text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
      }`}
    >
      <Icon size={18} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarPanel({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col bg-surface-raised">
      <div className="border-b border-border px-5 py-6">
        <Link href="/vendor/dashboard" onClick={onNavigate} className="block">
          <p className="font-display text-xl font-semibold text-text">flexrent</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Vendor
          </p>
        </Link>
        {user && (
          <p className="mt-3 text-xs leading-relaxed text-chalk">{user.companyName ?? user.fullName}</p>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="space-y-2 border-t border-border px-3 py-4">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-chalk/70">
          Settings
        </p>
        <Link
          href="/vendor/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-chalk transition-colors hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
        >
          <Palette size={18} />
          <span>Appearance</span>
        </Link>
        <ThemeToggle compact />
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-chalk transition-colors hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>

      <div className="border-t border-border px-5 py-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="text-xs text-chalk transition-colors hover:text-accent"
        >
          ← Back to site
        </Link>
      </div>
    </div>
  );
}

export function VendorSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface-raised px-4 md:hidden">
        <Link
          href="/vendor/dashboard"
          className="font-display text-lg font-semibold text-text"
        >
          flexrent <span className="text-accent">vendor</span>
        </Link>
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[280px] shadow-2xl">
            <SidebarPanel onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-[280px] border-r border-border md:block">
        <SidebarPanel />
      </aside>
    </>
  );
}
