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
  ChevronLeft,
  ChevronRight,
  UserRound,
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
  { href: "/vendor/profile", label: "Profile Settings", icon: UserRound },
];

function NavLink({ item, onNavigate, collapsed }: { item: NavItem; onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group flex items-center rounded-xl p-2.5 text-sm font-medium transition-all duration-300 ${
        collapsed ? "justify-center px-0" : "gap-3 px-3"
      } ${
        active
          ? "bg-accent text-black shadow-md shadow-accent/20"
          : "text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
      }`}
    >
      <div className={`transition-transform duration-300 ${!active && "group-hover:scale-110"}`}>
        <Icon size={18} />
      </div>
      {!collapsed && (
        <span className={`truncate transition-transform duration-300 ${!active && "group-hover:translate-x-1"}`}>{item.label}</span>
      )}
    </Link>
  );
}

function SidebarPanel({
  onNavigate,
  collapsed,
  setCollapsed,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  setCollapsed?: (val: boolean) => void;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col bg-surface-raised shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none">
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} border-b border-border/50 px-5 py-6 h-[76px]`}>
        {!collapsed && (
          <Link href="/vendor/dashboard" onClick={onNavigate} className="block group">
            <p className="font-display text-2xl font-bold bg-gradient-to-br from-text to-chalk bg-clip-text text-transparent">flexrent</p>
          </Link>
        )}
        <button
          onClick={() => setCollapsed?.(!collapsed)}
          className="hidden md:block rounded-lg p-1.5 text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} collapsed={collapsed} />
        ))}
      </nav>

      <div className="border-t border-border/50 px-3 py-4">
        <button
          type="button"
          onClick={handleLogout}
          className={`group flex w-full items-center rounded-xl py-2.5 text-sm font-medium text-chalk transition-all duration-300 hover:bg-danger/10 hover:text-danger dark:hover:bg-danger/20 ${
            collapsed ? "justify-center px-0" : "gap-3 px-3"
          }`}
        >
          <div className="transition-transform duration-300 group-hover:scale-110">
            <LogOut size={18} />
          </div>
          {!collapsed && (
            <span className="transition-transform duration-300 group-hover:translate-x-1">Sign out</span>
          )}
        </button>
      </div>

    </div>
  );
}

interface VendorSidebarProps {
  collapsed?: boolean;
  setCollapsed?: (val: boolean) => void;
}

export function VendorSidebar({ collapsed = false, setCollapsed }: VendorSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-surface-raised px-4 md:hidden">
        <Link
          href="/vendor/dashboard"
          className="font-display text-xl font-bold bg-gradient-to-br from-text to-chalk bg-clip-text text-transparent"
        >
          flexrent <span className="text-accent text-sm tracking-[0.2em] uppercase">vendor</span>
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

      <aside className={`fixed left-0 top-0 z-20 hidden h-screen border-r border-border/50 md:block transition-all duration-300 ${collapsed ? "w-[76px]" : "w-[280px]"}`}>
        <SidebarPanel collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>
    </>
  );
}
