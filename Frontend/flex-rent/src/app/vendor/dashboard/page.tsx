import {
  Package,
  IndianRupee,
  Truck,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  ArrowUpRight,
  CircleCheck,
  Clock3,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";

const stats = [
  {
    title: "My Products",
    value: "24",
    icon: Package,
    href: "/vendor/products",
  },
  {
    title: "Active Pricelists",
    value: "8",
    icon: IndianRupee,
    href: "/vendor/pricelists",
  },
  {
    title: "Pending Pickups",
    value: "5",
    icon: Truck,
    href: "/vendor/operations",
  },
  {
    title: "Due Returns",
    value: "3",
    icon: RotateCcw,
    href: "/vendor/operations",
  },
  {
    title: "Overdue",
    value: "1",
    icon: AlertTriangle,
    href: "/vendor/operations",
  },
  {
    title: "Monthly Earnings",
    value: "₹24,500",
    icon: BarChart3,
    href: "/vendor/operations",
  },
];

const recentOperations = [
  { orderId: "ORD-001", customer: "Ravi Sharma", product: "Jackhammer", scheduledAt: "Today, 10:00 AM", status: "scheduled_pickup" },
  { orderId: "ORD-002", customer: "Priya Patel", product: "Concrete Mixer", scheduledAt: "Today, 2:00 PM", status: "picked_up" },
  { orderId: "ORD-003", customer: "Amit Singh", product: "Power Trowel", scheduledAt: "Tomorrow, 9:00 AM", status: "scheduled_pickup" },
  { orderId: "ORD-004", customer: "Sneha Reddy", product: "Scaffolding Set", scheduledAt: "Jul 20, 4:00 PM", status: "due_return" },
  { orderId: "ORD-005", customer: "Vikram Joshi", product: "Plate Compactor", scheduledAt: "Jul 19, 11:00 AM", status: "returned" },
];

export default function VendorDashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your business performance and today’s priority work."
        action={<Link href="/vendor/products" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-400"><Plus size={18} /> Add product</Link>}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ title, value, icon: Icon, href }) => (
          <Link key={title} href={href}>
            <Panel className="group p-5 transition hover:-translate-y-0.5 hover:border-accent/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chalk">{title}</p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight text-text">
                    {value}
                  </p>
                </div>
                <div className="rounded-xl bg-accent/15 p-3 text-accent transition group-hover:scale-105">
                  <Icon size={22} />
                </div>
              </div>
            </Panel>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-6"><div><h2 className="font-display text-lg font-semibold text-text">Upcoming operations</h2><p className="mt-1 text-sm text-chalk">Keep orders moving without missing a handoff.</p></div><Link href="/vendor/operations" className="text-sm font-semibold text-accent hover:text-yellow-400">View all</Link></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-black/[0.02] text-left text-xs uppercase tracking-wider text-chalk dark:bg-white/[0.02]">
                <th className="px-5 py-3.5 font-semibold sm:px-6">Order</th><th className="px-5 py-3.5 font-semibold">Customer</th><th className="px-5 py-3.5 font-semibold">Product</th><th className="px-5 py-3.5 font-semibold">When</th><th className="px-5 py-3.5 font-semibold sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOperations.map((op) => (
                <tr key={op.orderId} className="border-t border-border/60 transition hover:bg-accent/[0.035]">
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-text sm:px-6">
                    {op.orderId}
                  </td>
                  <td className="px-5 py-4 font-medium text-text">{op.customer}</td>
                  <td className="px-5 py-4 text-chalk">{op.product}</td>
                  <td className="px-5 py-4 text-chalk">{op.scheduledAt}</td>
                  <td className="px-5 py-4 sm:px-6">
                    <StatusBadge status={op.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="space-y-6"><Panel className="p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-accent/15 p-2.5 text-accent"><Clock3 size={20} /></div><div><h2 className="font-display font-semibold text-text">Today’s workload</h2><p className="text-xs text-chalk">6 tasks remaining</p></div></div><div className="mt-5 space-y-3 text-sm"><div className="flex items-center justify-between"><span className="text-chalk">Pickups to prepare</span><span className="font-bold text-text">5</span></div><div className="flex items-center justify-between"><span className="text-chalk">Returns to inspect</span><span className="font-bold text-text">3</span></div><div className="flex items-center justify-between"><span className="text-chalk">Overdue follow-ups</span><span className="font-bold text-danger">1</span></div></div><Link href="/vendor/operations" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-accent">Open operations <ArrowUpRight size={16} /></Link></Panel><Panel className="bg-gradient-to-br from-surface-raised to-accent/10 p-5"><CircleCheck size={22} className="text-accent" /><h2 className="mt-3 font-display text-xl font-semibold text-text">Inventory health</h2><p className="mt-1 text-sm text-chalk">21 of 24 products are ready to rent.</p><Link href="/vendor/products" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-text hover:text-accent">Review inventory <ArrowUpRight size={16} /></Link></Panel></div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled_pickup: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    picked_up: "bg-accent/15 text-yellow-800 dark:text-accent",
    due_return: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-300",
    returned: "bg-green-500/15 text-green-700 dark:text-green-300",
    overdue: "bg-danger/15 text-red-700 dark:text-red-300",
  };
  const labels: Record<string, string> = {
    scheduled_pickup: "Pickup",
    picked_up: "Picked up",
    due_return: "Due return",
    returned: "Returned",
    overdue: "Overdue",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ?? "bg-black/5 text-chalk dark:bg-white/10"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
