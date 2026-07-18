import {
  Package,
  IndianRupee,
  Truck,
  AlertTriangle,
  RotateCcw,
  BarChart3,
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
        description="Your rental business at a glance."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            Upcoming operations
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-chalk">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOperations.map((op) => (
                <tr key={op.orderId} className="border-t border-white/5">
                  <td className="px-5 py-3 font-mono text-xs text-text">
                    {op.orderId}
                  </td>
                  <td className="px-5 py-3 text-text">{op.customer}</td>
                  <td className="px-5 py-3 text-text">{op.product}</td>
                  <td className="px-5 py-3 text-chalk">{op.scheduledAt}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={op.status} />
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
    scheduled_pickup: "bg-blue-500/15 text-blue-300",
    picked_up: "bg-accent/15 text-accent",
    due_return: "bg-yellow-500/15 text-yellow-300",
    returned: "bg-green-500/15 text-green-300",
    overdue: "bg-danger/15 text-red-300",
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
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-white/10 text-chalk"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
