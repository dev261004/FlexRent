"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarRange, ChevronLeft, ChevronRight, LayoutDashboard, LogOut, PackageSearch, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/catalog", label: "Browse rentals", icon: PackageSearch },
  { href: "/dashboard/orders", label: "My bookings", icon: CalendarRange },
  { href: "/dashboard/profile", label: "Profile & address", icon: UserRound },
];

interface CustomerSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function CustomerSidebar({ collapsed, setCollapsed }: CustomerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return <aside className={`hidden shrink-0 border-r border-border/50 bg-surface-raised shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none lg:block transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}>
    <div className="sticky top-[65px] flex min-h-[calc(100vh-65px)] flex-col px-4 py-7">
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} mb-6 px-3`}>
        {!collapsed && (
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] bg-gradient-to-br from-text to-chalk bg-clip-text text-transparent">
            Customer portal
          </p>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="space-y-1">{items.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return <Link key={href} href={href} className={`group flex items-center rounded-xl p-3 text-sm font-semibold transition-all duration-300 ${collapsed ? "justify-center" : "gap-3"} ${active ? "bg-accent text-black shadow-md shadow-accent/20" : "text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5"}`}><div className={`transition-transform duration-300 ${!active && "group-hover:scale-110"}`}><Icon size={18} /></div>{!collapsed && <span className={`transition-transform duration-300 ${!active && "group-hover:translate-x-1"}`}>{label}</span>}</Link>;
      })}</nav>

      <div className="mt-auto border-t border-border/50 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className={`group flex w-full items-center rounded-xl py-2.5 text-sm font-medium text-chalk transition-all duration-300 hover:bg-danger/10 hover:text-danger dark:hover:bg-danger/20 ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}
        >
          <div className="transition-transform duration-300 group-hover:scale-110">
            <LogOut size={18} />
          </div>
          {!collapsed && <span className="transition-transform duration-300 group-hover:translate-x-1">Sign out</span>}
        </button>
      </div>
    </div>
  </aside>;
}
