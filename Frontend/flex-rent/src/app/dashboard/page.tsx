"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Package, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { getOrders, type RentalOrder } from "@/features/customer/api";
import { Panel } from "@/components/admin/Panel";

const money = (value: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));
const dashboardStats = [
  { label: "Active bookings", key: "active", Icon: Package },
  { label: "Upcoming pickups", key: "upcoming", Icon: CalendarDays },
  { label: "Completed rentals", key: "completed", Icon: RotateCcw },
] as const;
export default function CustomerDashboardPage() {
  const [orders, setOrders] = useState<RentalOrder[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { getOrders().then((d) => setOrders(d.rentalOrders ?? d.orders ?? [])).catch(() => setOrders([])).finally(() => setLoading(false)); }, []);
  const active = orders.filter((o) => ["QUOTATION", "CONFIRMED", "PICKED_UP"].includes(o.status));
  const upcoming = active.filter((o) => new Date(o.rentalStart) >= new Date()).length;
  return <div>
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">Your rental space</p><h1 className="font-display text-3xl font-bold text-text sm:text-4xl">Everything, right on schedule.</h1><p className="mt-2 text-sm text-chalk">Browse, book, and manage every rental in one place.</p></div><Link href="/dashboard/catalog" className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-[#1a1817]">Browse rentals <ArrowUpRight size={16}/></Link></div>
    <div className="mb-8 grid gap-4 sm:grid-cols-3">{dashboardStats.map(({ label, key, Icon }) => { const value = key === "active" ? active.length : key === "upcoming" ? upcoming : orders.filter(o => o.status === "RETURNED").length; return <Panel key={label} className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-chalk">{label}</p><p className="mt-2 font-display text-3xl font-bold text-text">{loading ? "—" : String(value)}</p></div><div className="rounded-xl bg-accent/15 p-3 text-accent"><Icon size={22}/></div></div></Panel>; })}</div>
    <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-border px-5 py-5"><div><h2 className="font-display text-lg font-semibold text-text">Recent bookings</h2><p className="mt-1 text-sm text-chalk">Live rental orders from your account.</p></div><Link href="/dashboard/orders" className="text-sm font-bold text-accent">View all</Link></div>{!loading && orders.length === 0 ? <div className="p-10 text-center"><Package className="mx-auto text-accent"/><p className="mt-3 font-semibold text-text">No bookings yet</p><Link href="/dashboard/catalog" className="mt-3 inline-block text-sm font-bold text-accent">Find something to rent</Link></div> : <div className="divide-y divide-border">{orders.slice(0, 5).map(o => <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="font-semibold text-text">{o.items[0]?.product.name ?? o.rentalNumber}</p><p className="mt-1 text-xs text-chalk">{new Date(o.rentalStart).toLocaleDateString("en-IN", {day:"numeric", month:"short"})} – {new Date(o.rentalEnd).toLocaleDateString("en-IN", {day:"numeric", month:"short", year:"numeric"})}</p></div><div className="text-right"><p className="font-semibold text-text">{money(o.grandTotal)}</p><span className="mt-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">{o.status.replace("_", " ")}</span></div></div>)}</div>}</Panel>
  </div>;
}
