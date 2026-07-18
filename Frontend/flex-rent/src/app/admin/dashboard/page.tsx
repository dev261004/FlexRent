import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CircleAlert,
  Package,
  Users,
  IndianRupee,
  AlertTriangle,
  Truck,
  RotateCcw,
  Plus,
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

const activity = [
  { title: "Camera kit pickup confirmed", detail: "ORD-1048 · 11:30 AM", type: "success" },
  { title: "Return inspection due", detail: "ORD-1042 · today, 4:00 PM", type: "warning" },
  { title: "New quotation request", detail: "Aarav Shah · 18 items", type: "neutral" },
];

export default function AdminOverviewPage() {
  const recent = MOCK_OPERATIONS.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Here’s what needs your attention across the rental operation."
        action={
          <Link
            href="/admin/products"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-400 sm:w-auto"
          >
            <Plus size={18} /> Add product
          </Link>
        }
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ title, value, icon: Icon, href }, index) => (
          <Link key={title} href={href}>
            <Panel className="group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:border-accent/50">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10 transition group-hover:scale-125" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chalk">{title}</p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight text-text">
                    {value}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-chalk/80">
                    {index < 3 ? "Updated just now" : "Needs review"}
                    <ArrowUpRight size={13} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </p>
                </div>
                <div className="relative rounded-xl bg-accent/15 p-3 text-accent">
                  <Icon size={22} />
                </div>
              </div>
            </Panel>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-text">Recent operations</h2>
              <p className="mt-1 text-sm text-chalk">Latest movement across orders and inventory.</p>
            </div>
            <Link href="/admin/operations" className="text-sm font-semibold text-accent hover:text-yellow-400">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-black/[0.02] text-left text-xs uppercase tracking-wider text-chalk dark:bg-white/[0.02]">
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Order</th>
                  <th className="px-5 py-3.5 font-semibold">Customer</th>
                  <th className="px-5 py-3.5 font-semibold">Product</th>
                  <th className="px-5 py-3.5 font-semibold">Schedule</th>
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((op) => (
                  <tr key={op.id} className="border-t border-border/60 transition hover:bg-accent/[0.035]">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-text sm:px-6">{op.orderId}</td>
                    <td className="px-5 py-4 font-medium text-text">{op.customer}</td>
                    <td className="px-5 py-4 text-chalk">{op.product}</td>
                    <td className="px-5 py-4 text-chalk">{op.scheduledAt}</td>
                    <td className="px-5 py-4 sm:px-6"><StatusBadge status={op.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent/15 p-2.5 text-accent"><CalendarDays size={20} /></div>
              <div><h2 className="font-display font-semibold text-text">Today’s focus</h2><p className="text-xs text-chalk">18 July · Friday</p></div>
            </div>
            <div className="mt-5 space-y-4">
              {activity.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="mt-0.5 text-accent">
                    {item.type === "success" ? <CheckCircle2 size={17} /> : item.type === "warning" ? <CircleAlert size={17} /> : <Clock3 size={17} />}
                  </div>
                  <div><p className="text-sm font-medium text-text">{item.title}</p><p className="mt-0.5 text-xs text-chalk">{item.detail}</p></div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="overflow-hidden bg-gradient-to-br from-surface-raised to-accent/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Quick action</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-text">Create a rental quote</h2>
            <p className="mt-2 text-sm leading-relaxed text-chalk">Prepare a shareable quote for a customer in a few steps.</p>
            <Link href="/admin/quotations" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-text hover:text-accent">Open quotations <ArrowUpRight size={16} /></Link>
          </Panel>
        </div>
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
