"use client";

import { useEffect, useState } from "react";
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
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { getRentalOperationsDashboard } from "@/features/admin/api";
import { getOrders, getProducts, type RentalOrder } from "@/features/customer/api";
import { listPriceLists } from "@/features/pricing/api";
import type { RentalOperationsDashboardMetrics } from "@/features/admin/types";

const formatPrice = (amount: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export default function VendorDashboardPage() {
  const [metrics, setMetrics] = useState<RentalOperationsDashboardMetrics | null>(null);
  const [operations, setOperations] = useState<RentalOrder[]>([]);
  const [productCount, setProductCount] = useState<number>(0);
  const [pricelistCount, setPricelistCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVendorDashboard = async () => {
    try {
      setIsLoading(true);
      const [dashData, ordersData, prodData, plData] = await Promise.allSettled([
        getRentalOperationsDashboard("this_month"),
        getOrders(),
        getProducts(),
        listPriceLists(),
      ]);

      if (dashData.status === "fulfilled" && dashData.value?.metrics) {
        setMetrics(dashData.value.metrics);
      }

      if (ordersData.status === "fulfilled") {
        const list = ordersData.value.rentalOrders || ordersData.value.orders || [];
        setOperations(list.slice(0, 6));
      }

      if (prodData.status === "fulfilled" && prodData.value?.products) {
        setProductCount(
          prodData.value.pagination?.total ?? prodData.value.products.length
        );
      }

      if (plData.status === "fulfilled" && Array.isArray(plData.value)) {
        setPricelistCount(plData.value.length);
      }
    } catch {
      // Fallback gracefully
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorDashboard();
  }, []);

  const stats = [
    {
      title: "My Products",
      value: String(productCount || 0),
      icon: Package,
      href: "/vendor/products",
    },
    {
      title: "Active Pricelists",
      value: String(pricelistCount || 0),
      icon: IndianRupee,
      href: "/vendor/pricelists",
    },
    {
      title: "Pending Pickups",
      value: String(metrics?.upcomingPickups ?? 0),
      icon: Truck,
      href: "/vendor/operations",
    },
    {
      title: "Due Returns",
      value: String(metrics?.upcomingReturns ?? 0),
      icon: RotateCcw,
      href: "/vendor/operations",
    },
    {
      title: "Overdue",
      value: String(metrics?.overdueRentals ?? 0),
      icon: AlertTriangle,
      href: "/vendor/operations",
    },
    {
      title: "Monthly Earnings",
      value: formatPrice(metrics?.revenueFromRentals ?? 0),
      icon: BarChart3,
      href: "/vendor/operations",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your business performance, revenue collection, and priority operations."
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchVendorDashboard}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-chalk hover:text-text hover:bg-white/5 transition"
              title="Refresh operations"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-accent" : ""} />
              <span>Refresh</span>
            </button>
            <Link
              href="/vendor/products"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-black transition hover:bg-yellow-400 shadow-sm shadow-accent/20"
            >
              <Plus size={16} /> Add Product
            </Link>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ title, value, icon: Icon, href }) => (
          <Link key={title} href={href}>
            <Panel className="group p-5 transition hover:-translate-y-0.5 hover:border-accent/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-chalk">{title}</p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight text-text">
                    {isLoading ? (
                      <span className="inline-block h-8 w-14 animate-pulse rounded bg-surface" />
                    ) : (
                      value
                    )}
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

      {/* Operations Table & Focus Sidebar */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-text">
                Upcoming Operations
              </h2>
              <p className="mt-1 text-sm text-chalk">
                Keep orders moving without missing a handover or return.
              </p>
            </div>
            <Link
              href="/vendor/operations"
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
                  <th className="px-5 py-3.5 font-semibold">When</th>
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading && operations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-chalk">
                      <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-accent" />
                      Loading live operations...
                    </td>
                  </tr>
                ) : operations.length > 0 ? (
                  operations.map((op) => {
                    const firstItem = op.items?.[0];
                    const customerName =
                      op.customer?.fullName ||
                      `${op.customer?.firstName ?? ""} ${op.customer?.lastName ?? ""}`.trim() ||
                      op.customer?.email ||
                      "Customer";
                    const productName = firstItem?.product?.name || "Equipment Rental";

                    return (
                      <tr
                        key={op.id}
                        className="transition hover:bg-accent/[0.035]"
                      >
                        <td className="px-5 py-4 font-mono text-xs font-semibold text-text sm:px-6">
                          <Link
                            href={`/vendor/operations/${op.id}`}
                            className="hover:text-accent hover:underline"
                          >
                            {op.rentalNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-4 font-medium text-text">
                          {customerName}
                        </td>
                        <td className="px-5 py-4 text-chalk">
                          {productName}
                          {op.items && op.items.length > 1 && (
                            <span className="ml-1 text-[11px] text-accent">
                              (+{op.items.length - 1} more)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-chalk">
                          {new Date(op.rentalStart).toLocaleDateString("en-IN")} →{" "}
                          {new Date(op.rentalEnd).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-5 py-4 sm:px-6">
                          <StatusBadge status={op.status} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-chalk">
                      No operations currently scheduled. New orders will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Priority Focus Sidebar */}
        <Panel className="p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Clock3 size={18} className="text-accent" />
            <h3 className="font-display font-semibold text-text">Today's Priority</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="rounded-xl bg-surface/70 p-3 border border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                Pickups
              </span>
              <p className="mt-1 font-semibold text-text">
                {metrics?.upcomingPickups ?? 0} pickup(s) awaiting dispatch
              </p>
              <p className="text-chalk text-[11px] mt-0.5">
                Verify asset condition and packaging.
              </p>
            </div>

            <div className="rounded-xl bg-surface/70 p-3 border border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Security Deposits
              </span>
              <p className="mt-1 font-semibold text-text">
                {formatPrice(metrics?.securityDepositsHeld ?? 0)} safely held
              </p>
              <p className="text-chalk text-[11px] mt-0.5">
                Deposits are reconciled upon item inspection.
              </p>
            </div>

            <div className="rounded-xl bg-surface/70 p-3 border border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Returns Tracking
              </span>
              <p className="mt-1 font-semibold text-text">
                {metrics?.upcomingReturns ?? 0} items due for return
              </p>
              <p className="text-chalk text-[11px] mt-0.5">
                Inspect items upon arrival to release deposits.
              </p>
            </div>
          </div>
        </Panel>
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
