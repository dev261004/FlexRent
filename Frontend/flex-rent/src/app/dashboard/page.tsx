import {
  Package,
  Truck,
  RotateCcw,
  Clock,
  ArrowUpRight,
  CalendarDays,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/admin/Panel";

const stats = [
  {
    title: "Active Rentals",
    value: "2",
    icon: Package,
    href: "#",
  },
  {
    title: "Upcoming Pickups",
    value: "1",
    icon: Truck,
    href: "#",
  },
  {
    title: "Due Returns",
    value: "1",
    icon: RotateCcw,
    href: "#",
  },
  {
    title: "Past Rentals",
    value: "7",
    icon: Clock,
    href: "#",
  },
];

const activeRentals = [
  {
    id: "RNT-001",
    product: "Jackhammer - Bosch GSH 16-30",
    vendor: "Patel Tools",
    from: "Jul 15, 2026",
    to: "Jul 20, 2026",
    amount: "₹4,500",
    status: "active",
  },
  {
    id: "RNT-002",
    product: "Concrete Mixer - 5 cu.ft",
    vendor: "Singh Equipment",
    from: "Jul 18, 2026",
    to: "Jul 22, 2026",
    amount: "₹6,000",
    status: "active",
  },
  {
    id: "RNT-003",
    product: "Power Trowel - Marshalltown",
    vendor: "Patel Tools",
    from: "Jul 19, 2026",
    to: "Jul 19, 2026",
    amount: "₹1,200",
    status: "due_pickup",
  },
];

export default function CustomerDashboardPage() {
  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">Your rental space</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">Welcome back</h1>
          <p className="mt-2 text-sm text-chalk">Keep your rentals, pickups, and returns on track.</p>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-yellow-400">Browse equipment <ArrowUpRight size={16} /></Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-6">
          <div><h2 className="font-display text-lg font-semibold text-text">My rentals</h2><p className="mt-1 text-sm text-chalk">Your current and upcoming equipment bookings.</p></div>
          <Link href="#" className="text-sm font-semibold text-accent hover:text-yellow-400">View history</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-black/[0.02] text-left text-xs uppercase tracking-wider text-chalk dark:bg-white/[0.02]">
                <th className="px-5 py-3.5 font-semibold sm:px-6">Product</th><th className="px-5 py-3.5 font-semibold">Vendor</th><th className="px-5 py-3.5 font-semibold">Period</th><th className="px-5 py-3.5 font-semibold">Amount</th><th className="px-5 py-3.5 font-semibold sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeRentals.map((rental) => (
                <tr key={rental.id} className="border-t border-border/60 transition hover:bg-accent/[0.035]">
                  <td className="px-5 py-4 font-medium text-text sm:px-6">{rental.product}</td>
                  <td className="px-5 py-3 text-chalk">{rental.vendor}</td>
                  <td className="px-5 py-4 text-chalk">
                    {rental.from} – {rental.to}
                  </td>
                  <td className="px-5 py-4 font-semibold text-text">
                    {rental.amount}
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <StatusBadge status={rental.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="space-y-6">
        <Panel className="p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-accent/15 p-2.5 text-accent"><CalendarDays size={20} /></div><div><h2 className="font-display font-semibold text-text">Next pickup</h2><p className="text-xs text-chalk">Tomorrow at 9:00 AM</p></div></div><p className="mt-5 text-sm font-medium text-text">Power Trowel - Marshalltown</p><div className="mt-3 flex items-start gap-2 text-sm text-chalk"><MapPin size={16} className="mt-0.5 shrink-0 text-accent" />Patel Tools, Andheri East</div><button type="button" className="mt-5 w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-text transition hover:border-accent/50 hover:text-accent">View pickup details</button></Panel>
        <Panel className="bg-gradient-to-br from-surface-raised to-accent/10 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Need equipment?</p><h2 className="mt-2 font-display text-xl font-semibold text-text">Find the right tool for the job.</h2><Link href="/" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-text hover:text-accent">Explore catalog <ArrowUpRight size={16} /></Link></Panel>
      </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/15 text-green-700 dark:text-green-300",
    due_pickup: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    overdue: "bg-danger/15 text-red-700 dark:text-red-300",
    returned: "bg-black/5 text-chalk dark:bg-white/10",
  };
  const labels: Record<string, string> = {
    active: "Active",
    due_pickup: "Due Pickup",
    overdue: "Overdue",
    returned: "Returned",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ?? "bg-black/5 text-chalk dark:bg-white/10"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
