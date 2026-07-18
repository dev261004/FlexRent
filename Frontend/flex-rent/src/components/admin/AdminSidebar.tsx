"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  CalendarRange,
  Users,
  Truck,
  Settings,
  FileText,
  PlusCircle,
  Wrench,
  ChevronDown,
  Menu,
  X,
  IndianRupee,
  Palette,
  LogOut,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

type NavLeaf = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  children: NavLeaf[];
};

const dashboardItem: NavLeaf = {
  href: "/admin/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
  exact: true,
};

const createGroup: NavGroup = {
  id: "create",
  label: "Create",
  icon: PlusCircle,
  children: [
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/pricelists", label: "Pricelists", icon: Tags },
    {
      href: "/admin/rental-periods",
      label: "Rental Periods",
      icon: CalendarRange,
    },
  ],
};

const usersItem: NavLeaf = {
  href: "/admin/users",
  label: "Users",
  icon: Users,
};

const rentalConfigItem: NavLeaf = {
  href: "/admin/settings",
  label: "Rental Configuration",
  icon: Settings,
};

const maintainGroup: NavGroup = {
  id: "maintain",
  label: "Maintain",
  icon: Wrench,
  children: [
    { href: "/admin/pricelists", label: "Pricelists", icon: Tags },
    {
      href: "/admin/settings",
      label: "Late Fees & Deposit",
      icon: IndianRupee,
    },
    { href: "/admin/operations", label: "Pickup & Return", icon: Truck },
  ],
};

const quotationItem: NavLeaf = {
  href: "/admin/quotations",
  label: "Quotation Templates",
  icon: FileText,
};

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActive(pathname: string, group: NavGroup) {
  return group.children.some((c) => isActive(pathname, c.href, c.exact));
}

function LeafLink({
  item,
  onNavigate,
  nested = false,
}: {
  item: NavLeaf;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href, item.exact);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
        nested ? "px-3 py-2" : "px-3 py-2.5"
      } ${
        active
          ? "bg-accent text-black"
          : "text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
      }`}
    >
      <Icon size={nested ? 16 : 18} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function CollapsibleGroup({
  group,
  onNavigate,
}: {
  group: NavGroup;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const hasActive = groupHasActive(pathname, group);
  const [expanded, setExpanded] = useState(true);
  const Icon = group.icon;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
          hasActive
            ? "bg-black/5 text-text dark:bg-white/5"
            : "text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
        }`}
        aria-expanded={expanded}
      >
        <Icon size={18} className={hasActive ? "text-accent" : undefined} />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="ml-3 space-y-0.5 border-l border-border pl-2">
          {group.children.map((child) => (
            <LeafLink
              key={`${group.id}-${child.href}-${child.label}`}
              item={child}
              onNavigate={onNavigate}
              nested
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarSettings({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const settingsActive = pathname === "/admin/account";

  const handleLogout = () => {
    logout();
    onNavigate?.();
    router.replace("/login");
  };

  return (
    <div className="space-y-2 border-t border-border px-3 py-4">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-chalk/70">
        Settings
      </p>

      <Link
        href="/admin/account"
        onClick={onNavigate}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          settingsActive
            ? "bg-accent text-black"
            : "text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
        }`}
      >
        <Palette size={18} />
        <span>Appearance</span>
      </Link>

      <ThemeToggle compact />

      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-chalk transition-colors hover:bg-danger/10 hover:text-danger"
      >
        <LogOut size={18} />
        <span>Sign out</span>
      </button>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      <div className="space-y-1">
        <LeafLink item={dashboardItem} onNavigate={onNavigate} />
      </div>

      <div className="space-y-1">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-chalk/70">
          Catalog
        </p>
        <CollapsibleGroup group={createGroup} onNavigate={onNavigate} />
      </div>

      <div className="space-y-1">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-chalk/70">
          Organization
        </p>
        <LeafLink item={usersItem} onNavigate={onNavigate} />
        <LeafLink item={rentalConfigItem} onNavigate={onNavigate} />
        <CollapsibleGroup group={maintainGroup} onNavigate={onNavigate} />
      </div>

      <div className="space-y-1">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-chalk/70">
          Documents
        </p>
        <LeafLink item={quotationItem} onNavigate={onNavigate} />
      </div>
    </nav>
  );
}

function SidebarPanel({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex h-full flex-col bg-surface-raised ${className ?? ""}`}>
      <div className="border-b border-border px-5 py-6">
        <Link href="/admin/dashboard" onClick={onNavigate} className="block">
          <p className="font-display text-xl font-semibold text-text">
            Flexrent
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Admin
          </p>
        </Link>
        <p className="mt-3 text-xs leading-relaxed text-chalk">
          Manage products, users, rentals & quotations.
        </p>
      </div>

      <NavLinks onNavigate={onNavigate} />
      <SidebarSettings onNavigate={onNavigate} />

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

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface-raised px-4 md:hidden">
        <Link
          href="/admin/dashboard"
          className="font-display text-lg font-semibold text-text"
        >
          flexrent <span className="text-accent">admin</span>
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
