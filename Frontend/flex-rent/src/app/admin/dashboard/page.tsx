import {
  Package,
  Users,
  IndianRupee,
  AlertTriangle,
  Truck,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { MOCK_PRODUCTS } from "@/features/admin/data/mockProducts";
import { MOCK_USERS } from "@/features/admin/data/mockUsers";
import { MOCK_OPERATIONS } from "@/features/admin/data/mockOperations";
import { MOCK_PRICELISTS } from "@/features/admin/data/mockPricelists";

const stats = [
  {
    title: "Products",
    value: String(MOCK_PRODUCTS.length),
    icon: Package,
    href: "/admin/products",
  },
  {
    title: "Active Users",
    value: String(MOCK_USERS.filter((u) => u.status === "active").length),
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Pricelists",
    value: String(MOCK_PRICELISTS.length),
    icon: IndianRupee,
    href: "/admin/pricelists",
  },
  {
    title: "Pending Pickups",
    value: String(
      MOCK_OPERATIONS.filter((o) => o.status === "scheduled_pickup").length
    ),
    icon: Truck,
    href: "/admin/operations",
  },
  {
    title: "Due Returns",
    value: String(
      MOCK_OPERATIONS.filter((o) => o.status === "due_return").length
    ),
    icon: RotateCcw,
    href: "/admin/operations",
  },
  {
    title: "Overdue",
    value: String(MOCK_OPERATIONS.filter((o) => o.status === "overdue").length),
    icon: AlertTriangle,
    href: "/admin/operations",
  },
];

export default function AdminOverviewPage() {
  const recent = MOCK_OPERATIONS.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Organization-wide rental management snapshot."
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
            Recent operations
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
              {recent.map((op) => (
                <tr key={op.id} className="border-t border-white/5">
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
