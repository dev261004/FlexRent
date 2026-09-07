"use client";

import { useEffect, useState } from "react";
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
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { getRentalOperationsDashboard, getUsers } from "@/features/admin/api";
import { getOrders, getProducts, type RentalOrder } from "@/features/customer/api";
import { listPriceLists } from "@/features/pricing/api";
import type { RentalOperationsDashboardMetrics } from "@/features/admin/types";

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<RentalOperationsDashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RentalOrder[]>([]);
  const [productCount, setProductCount] = useState<number>(0);
  const [userCount, setUserCount] = useState<number>(0);
  const [pricelistCount, setPricelistCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dashData, ordersData, prodData, usersData, plData] =
        await Promise.allSettled([
          getRentalOperationsDashboard("this_month"),
          getOrders(),
          getProducts(),
          getUsers({ limit: 100 }),
          listPriceLists(),
        ]);

      if (dashData.status === "fulfilled" && dashData.value?.metrics) {
        setMetrics(dashData.value.metrics);
      }

      if (ordersData.status === "fulfilled") {
        const orderList =
          ordersData.value.rentalOrders || ordersData.value.orders || [];
        setRecentOrders(orderList.slice(0, 8));
      }

      if (prodData.status === "fulfilled" && prodData.value?.products) {
        setProductCount(
          prodData.value.pagination?.total ?? prodData.value.products.length
        );
      }

      if (usersData.status === "fulfilled" && usersData.value?.users) {
        setUserCount(
          usersData.value.pagination?.total ?? usersData.value.users.length
        );
      }

      if (plData.status === "fulfilled" && Array.isArray(plData.value)) {
        setPricelistCount(plData.value.length);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: "Products",
      value: String(productCount || 0),
      icon: Package,
      href: "/admin/products",
      subtitle: "Catalog inventory",
    },
    {
      title: "Active Users",
      value: String(userCount || 0),
      icon: Users,
      href: "/admin/users",
      subtitle: "Customers & vendors",
    },
    {
      title: "Pricelists",
      value: String(pricelistCount || 0),
      icon: IndianRupee,
      href: "/admin/pricelists",
      subtitle: "Active rate schedules",
    },
    {
      title: "Pending Pickups",
      value: String(metrics?.upcomingPickups ?? 0),
      icon: Truck,
      href: "/admin/operations",
      subtitle: "Ready for collection",
    },
    {
      title: "Due Returns",
      value: String(metrics?.upcomingReturns ?? 0),
      icon: RotateCcw,
      href: "/admin/operations",
      subtitle: "Due today/this week",
    },
    {
      title: "Overdue",
      value: String(metrics?.overdueRentals ?? 0),
      icon: AlertTriangle,
      href: "/admin/operations",
      subtitle: "Requires intervention",
    },
  ];

  const activity = [
    {
      title: `${metrics?.activeRentals ?? 0} active rentals ongoing`,
      detail: `Monthly revenue: ₹${Number(metrics?.revenueFromRentals ?? 0).toLocaleString("en-IN")}`,
      type: "success",
    },
    {
      title: `${metrics?.securityDepositsHeld ? `₹${Number(metrics.securityDepositsHeld).toLocaleString("en-IN")}` : "₹0"} held in security deposit`,
      detail: "Safe custodial protection",
      type: "neutral",
    },
    {
      title: `${metrics?.overdueRentals ?? 0} overdue returns`,
      detail: metrics?.overdueRentals ? "Penalty rules triggered" : "All returns on schedule",
      type: (metrics?.overdueRentals ?? 0) > 0 ? "warning" : "success",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Real-time operations metrics and activity across the FlexRent ecosystem."
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-chalk hover:text-text hover:bg-white/5 transition"
              title="Refresh metrics"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-accent" : ""} />
              <span>Refresh</span>
            </button>
            <Link
              href="/admin/products"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-black transition hover:bg-yellow-400 sm:w-auto shadow-sm shadow-accent/20"
            >
              <Plus size={16} /> Add Product
            </Link>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ title, value, icon: Icon, href, subtitle }) => (
          <Link key={title} href={href}>
            <Panel className="group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:border-accent/50">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10 transition group-hover:scale-125" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chalk">{title}</p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight text-text">
                    {isLoading ? (
                      <span className="inline-block h-8 w-12 animate-pulse rounded bg-surface" />
                    ) : (
                      value
                    )}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-chalk/80">
                    <span>{subtitle}</span>
                    <ArrowUpRight
                      size={13}
                      className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-accent"
                    />
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

      {/* Operations Table & Focus Sidebar */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-text">
                Recent Operations
              </h2>
              <p className="mt-1 text-sm text-chalk">
                Live movement across orders, fulfillment handovers, and returns.
              </p>
            </div>
            <Link
              href="/admin/operations"
              className="text-sm font-semibold text-accent hover:text-yellow-400 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-black/[0.02] text-left text-xs uppercase tracking-wider text-chalk dark:bg-white/[0.02]">
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Order</th>
                  <th className="px-5 py-3.5 font-semibold">Customer</th>
                  <th className="px-5 py-3.5 font-semibold">Product</th>
                  <th className="px-5 py-3.5 font-semibold">Rental Dates</th>
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading && recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-chalk">
                      <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-accent" />
                      Loading live operations...
                    </td>
                  </tr>
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => {
                    const firstItem = order.items?.[0];
                    const customerName =
                      order.customer?.fullName ||
                      `${order.customer?.firstName ?? ""} ${order.customer?.lastName ?? ""}`.trim() ||
                      order.customer?.email ||
                      "Customer";
                    const productName = firstItem?.product?.name || "Equipment Rental";

                    return (
                      <tr
                        key={order.id}
                        className="transition hover:bg-accent/[0.035]"
                      >
                        <td className="px-5 py-4 font-mono text-xs font-semibold text-text sm:px-6">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="hover:text-accent hover:underline"
                          >
                            {order.rentalNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-4 font-medium text-text">
                          {customerName}
                        </td>
                        <td className="px-5 py-4 text-chalk">
                          {productName}
                          {order.items && order.items.length > 1 && (
                            <span className="ml-1 text-[11px] text-accent">
                              (+{order.items.length - 1} more)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-chalk">
                          {new Date(order.rentalStart).toLocaleDateString("en-IN")} →{" "}
                          {new Date(order.rentalEnd).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-5 py-4 sm:px-6">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  // Fallback to mock data if empty
                  MOCK_OPERATIONS.slice(0, 5).map((op) => (
                    <tr
                      key={op.id}
                      className="transition hover:bg-accent/[0.035]"
                    >
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Sidebar */}
        <div className="space-y-6">
          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent/15 p-2.5 text-accent">
                <CalendarDays size={20} />
              </div>
              <div>
                <h2 className="font-display font-semibold text-text">Live Focus</h2>
                <p className="text-xs text-chalk">
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {activity.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="mt-0.5 text-accent">
                    {item.type === "success" ? (
                      <CheckCircle2 size={17} />
                    ) : item.type === "warning" ? (
                      <CircleAlert size={17} />
                    ) : (
                      <Clock3 size={17} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{item.title}</p>
                    <p className="mt-0.5 text-xs text-chalk">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="overflow-hidden bg-gradient-to-br from-surface-raised to-accent/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Quick Action
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold text-text">
              Quotation Templates
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-chalk">
              Standardize headers, footers, and validity rules for rapid quotation creation.
            </p>
            <Link
              href="/admin/quotations"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-text hover:text-accent"
            >
              Open Quotations <ArrowUpRight size={16} />
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase();
  const styles: Record<string, string> = {
    scheduled_pickup: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    pickup_scheduled: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    picked_up: "bg-accent/15 text-yellow-800 dark:text-accent",
    active: "bg-green-500/15 text-green-700 dark:text-green-300",
    due_return: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-300",
    return_scheduled: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-300",
    returned: "bg-green-500/15 text-green-700 dark:text-green-300",
    overdue: "bg-danger/15 text-red-700 dark:text-red-300",
    quotation: "bg-white/10 text-chalk",
    confirmed: "bg-emerald-500/15 text-emerald-400",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[normalized] ?? "bg-black/5 text-chalk dark:bg-white/10"
      }`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}
