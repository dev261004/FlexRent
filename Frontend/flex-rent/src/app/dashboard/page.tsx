import {
  Package,
  Truck,
  RotateCcw,
  Clock,
  AlertTriangle,
  CheckCircle2,
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
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          My Dashboard
        </h1>
        <p className="mt-1 text-sm text-chalk">
          Track your rentals, pickups, and returns.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, href }) => (
          <Link key={title} href={href}>
            <Panel className="p-5 transition hover:border-accent/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-chalk">{title}</p>
                  <p className="mt-2 font-display text-2xl font-bold text-text">
                    {value}
                  </p>
                </div>
                <div className="rounded-lg bg-accent/15 p-3 text-accent">
                  <Icon size={22} />
                </div>
              </div>
            </Panel>
          </Link>
        ))}
      </div>

      <Panel>
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-text">
            My Rentals
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-chalk">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">Period</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeRentals.map((rental) => (
                <tr key={rental.id} className="border-t border-white/5">
                  <td className="px-5 py-3 text-text">{rental.product}</td>
                  <td className="px-5 py-3 text-chalk">{rental.vendor}</td>
                  <td className="px-5 py-3 text-chalk">
                    {rental.from} – {rental.to}
                  </td>
                  <td className="px-5 py-3 font-medium text-text">
                    {rental.amount}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={rental.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/15 text-green-300",
    due_pickup: "bg-blue-500/15 text-blue-300",
    overdue: "bg-danger/15 text-red-300",
    returned: "bg-white/10 text-chalk",
  };
  const labels: Record<string, string> = {
    active: "Active",
    due_pickup: "Due Pickup",
    overdue: "Overdue",
    returned: "Returned",
  };
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-white/10 text-chalk"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
