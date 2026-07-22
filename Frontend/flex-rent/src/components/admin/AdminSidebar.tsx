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
  ChevronLeft,
  ChevronRight,
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
  collapsed = false,
}: {
  item: NavLeaf;
  onNavigate?: () => void;
  nested?: boolean;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href, item.exact);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group flex items-center rounded-xl text-sm font-medium transition-all duration-300 ${
        nested ? "px-3 py-2" : "px-3 py-2.5"
      } ${
        collapsed ? "justify-center px-0" : "gap-3"
      } ${
        active
          ? "bg-accent text-black shadow-md shadow-accent/20"
          : "text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
      }`}
    >
      <div className={`transition-transform duration-300 ${!active && "group-hover:scale-110"}`}>
        <Icon size={nested ? 16 : 18} />
      </div>
      {!collapsed && (
        <span className={`truncate transition-transform duration-300 ${!active && "group-hover:translate-x-1"}`}>{item.label}</span>
      )}
    </Link>
  );
}

function CollapsibleGroup({
  group,
  onNavigate,
  collapsed = false,
  setCollapsed,
}: {
  group: NavGroup;
  onNavigate?: () => void;
  collapsed?: boolean;
  setCollapsed?: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const hasActive = groupHasActive(pathname, group);
  const [expanded, setExpanded] = useState(true);
  const Icon = group.icon;

  const handleClick = () => {
    if (collapsed && setCollapsed) {
      setCollapsed(false);
      setExpanded(true);
    } else {
      setExpanded((v) => !v);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        className={`group flex w-full items-center rounded-xl p-2.5 text-sm font-semibold transition-all duration-300 ${
          collapsed ? "justify-center px-0" : "gap-3 px-3"
        } ${
          hasActive
            ? "bg-black/5 text-text dark:bg-white/5"
            : "text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
        }`}
        aria-expanded={expanded && !collapsed}
      >
        <div className="transition-transform duration-300 group-hover:scale-110">
          <Icon size={18} className={hasActive ? "text-accent" : undefined} />
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 text-left transition-transform duration-300 group-hover:translate-x-1">{group.label}</span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      {!collapsed && (
        <div 
          className={`ml-3 space-y-0.5 border-l border-border/50 pl-2 overflow-hidden transition-all duration-300 ease-in-out ${
            expanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
          }`}
        >
          {group.children.map((child) => (
            <LeafLink
              key={`${group.id}-${child.href}-${child.label}`}
              item={child}
              onNavigate={onNavigate}
              nested
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarSettings({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    router.replace("/login");
  };

  return (
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
  );
}

function NavLinks({
  onNavigate,
  collapsed = false,
  setCollapsed,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  setCollapsed?: (val: boolean) => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      <div className="space-y-1">
        <LeafLink item={dashboardItem} onNavigate={onNavigate} collapsed={collapsed} />
      </div>

      <div className="space-y-1">
        {!collapsed && (
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-chalk/70">
            Catalog
          </p>
        )}
        <CollapsibleGroup group={createGroup} onNavigate={onNavigate} collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      <div className="space-y-1">
        {!collapsed && (
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-chalk/70">
            Organization
          </p>
        )}
        <LeafLink item={usersItem} onNavigate={onNavigate} collapsed={collapsed} />
        <LeafLink item={rentalConfigItem} onNavigate={onNavigate} collapsed={collapsed} />
        <CollapsibleGroup group={maintainGroup} onNavigate={onNavigate} collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      <div className="space-y-1">
        {!collapsed && (
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-chalk/70">
            Documents
          </p>
        )}
        <LeafLink item={quotationItem} onNavigate={onNavigate} collapsed={collapsed} />
      </div>
    </nav>
  );
}

function SidebarPanel({
  onNavigate,
  className,
  collapsed = false,
  setCollapsed,
}: {
  onNavigate?: () => void;
  className?: string;
  collapsed?: boolean;
  setCollapsed?: (val: boolean) => void;
}) {
  return (
    <div className={`flex h-full flex-col bg-surface-raised shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none ${className ?? ""}`}>
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} border-b border-border/50 px-5 py-6 h-[76px]`}>
        {!collapsed && (
          <Link href="/admin/dashboard" onClick={onNavigate} className="block group">
            <p className="font-display text-2xl font-bold bg-gradient-to-br from-text to-chalk bg-clip-text text-transparent">
              flexrent
            </p>
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

      <NavLinks onNavigate={onNavigate} collapsed={collapsed} setCollapsed={setCollapsed} />
      <SidebarSettings onNavigate={onNavigate} collapsed={collapsed} />

    </div>
  );
}

interface AdminSidebarProps {
  collapsed?: boolean;
  setCollapsed?: (val: boolean) => void;
}

export function AdminSidebar({ collapsed = false, setCollapsed }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-surface-raised px-4 md:hidden">
        <Link
          href="/admin/dashboard"
          className="font-display text-xl font-bold bg-gradient-to-br from-text to-chalk bg-clip-text text-transparent"
        >
          flexrent <span className="text-accent text-sm tracking-[0.2em] uppercase">admin</span>
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
