"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarRange, LayoutDashboard, MapPin, PackageSearch, UserRound } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/catalog", label: "Browse rentals", icon: PackageSearch },
  { href: "/dashboard/orders", label: "My bookings", icon: CalendarRange },
  { href: "/dashboard/profile", label: "Profile & address", icon: UserRound },
];

export function CustomerSidebar() {
  const pathname = usePathname();
  return <aside className="hidden w-64 shrink-0 border-r border-border/50 bg-surface-raised shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none lg:block">
    <div className="sticky top-[65px] flex min-h-[calc(100vh-65px)] flex-col px-4 py-7">
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.2em] bg-gradient-to-br from-text to-chalk bg-clip-text text-transparent">Customer portal</p>
      <nav className="space-y-1">{items.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return <Link key={href} href={href} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-300 ${active ? "bg-accent text-black shadow-md shadow-accent/20" : "text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5"}`}><div className={`transition-transform duration-300 ${!active && "group-hover:scale-110"}`}><Icon size={18} /></div><span className={`transition-transform duration-300 ${!active && "group-hover:translate-x-1"}`}>{label}</span></Link>;
      })}</nav>
      <div className="mt-auto rounded-2xl border border-border/50 bg-surface p-4 shadow-sm"><MapPin className="mb-3 text-accent" size={20}/><p className="text-sm font-semibold text-text">Flexible fulfilment</p><p className="mt-1 text-xs leading-5 text-chalk">Choose store collection or delivery during booking.</p></div>
    </div>
  </aside>;
}
