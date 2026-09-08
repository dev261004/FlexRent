"use client";

import { useEffect, useState, useMemo } from "react";
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
  MapPin,
  CheckCircle2,
  Calendar,
  Navigation,
  ShieldCheck,
  ChevronRight,
  Phone,
  User,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { getRentalOperationsDashboard } from "@/features/admin/api";
import {
  getOrders,
  getProducts,
  startPickupJourney,
  markVendorArrived,
  updatePickupEta,
  completePickupVendor,
  schedulePickup,
  type RentalOrder,
} from "@/features/customer/api";
import { listPriceLists } from "@/features/pricing/api";
import type { RentalOperationsDashboardMetrics } from "@/features/admin/types";
import { PickupSchedulerModal } from "@/components/vendor/PickupSchedulerModal";

const formatPrice = (amount: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

type OperationalTab = "today" | "upcoming" | "in_progress" | "waiting_confirmation";

export default function VendorDashboardPage() {
  const [metrics, setMetrics] = useState<RentalOperationsDashboardMetrics | null>(null);
  const [allOrders, setAllOrders] = useState<RentalOrder[]>([]);
  const [productCount, setProductCount] = useState<number>(0);
  const [pricelistCount, setPricelistCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Operational tab selection
  const [activeTab, setActiveTab] = useState<OperationalTab>("today");

  // Action states
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [schedulerOrder, setSchedulerOrder] = useState<RentalOrder | null>(null);
  const [etaModalOrder, setEtaModalOrder] = useState<RentalOrder | null>(null);
  const [etaInput, setEtaInput] = useState<number>(15);

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
        setAllOrders(list);
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
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorDashboard();
  }, []);

  // Operational Filters according to p.md
  // 1. Today's Pickups
  const todayPickups = useMemo(() => {
    const now = new Date();
    return allOrders.filter((o) => {
      if (o.status === "PICKUP_SCHEDULED" && o.pickupScheduledAt) {
        return isSameDay(new Date(o.pickupScheduledAt), now);
      }
      if (o.status === "CONFIRMED" && !o.pickupStartedAt) {
        return isSameDay(new Date(o.rentalStart), now);
      }
      return false;
    });
  }, [allOrders]);

  // 2. Upcoming Pickups
  const upcomingPickups = useMemo(() => {
    const now = new Date();
    return allOrders.filter((o) => {
      if (o.status === "PICKUP_SCHEDULED" && o.pickupScheduledAt) {
        const d = new Date(o.pickupScheduledAt);
        return d.getTime() > now.getTime() && !isSameDay(d, now);
      }
      if (o.status === "CONFIRMED" && !o.pickupStartedAt) {
        const d = new Date(o.rentalStart);
        return d.getTime() > now.getTime() && !isSameDay(d, now);
      }
      return false;
    });
  }, [allOrders]);

  // 3. Pickups In Progress
  const inProgressPickups = useMemo(() => {
    return allOrders.filter(
      (o) => o.status === "PICKUP_IN_PROGRESS" && !o.pickupArrivedAt
    );
  }, [allOrders]);

  // 4. Waiting Customer Confirmation
  const waitingConfirmation = useMemo(() => {
    return allOrders.filter(
      (o) =>
        ((o.status === "PICKUP_IN_PROGRESS" && Boolean(o.pickupArrivedAt)) ||
          o.status === "PICKED_UP") &&
        !o.pickupConfirmedByCustomer &&
        o.status !== "ACTIVE"
    );
  }, [allOrders]);

  // Quick Action Handlers
  const handleStartJourney = async (orderId: string) => {
    try {
      setLoadingActionId(orderId);
      await startPickupJourney(orderId);
      toast.success("Pickup journey started! Customer has been notified.", {
        icon: "🚚",
      });
      fetchVendorDashboard();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to start journey");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleMarkArrived = async (orderId: string) => {
    try {
      setLoadingActionId(orderId);
      await markVendorArrived(orderId);
      toast.success("Marked as arrived! Customer notified to collect rental.", {
        icon: "📍",
      });
      fetchVendorDashboard();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to record arrival");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCompleteHandover = async (orderId: string) => {
    try {
      setLoadingActionId(orderId);
      await completePickupVendor(orderId, "Vendor completed item handover");
      toast.success("Handover recorded! Waiting for customer confirmation.", {
        icon: "📦",
      });
      fetchVendorDashboard();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to complete handover");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleScheduleSubmit = async (data: {
    pickupScheduledAt: string;
    pickupETAInMinutes?: number;
    notes?: string;
  }) => {
    if (!schedulerOrder) return;
    try {
      await schedulePickup(schedulerOrder.id, data);
      toast.success("Pickup scheduled successfully! Customer notified.", {
        icon: "📅",
      });
      setSchedulerOrder(null);
      fetchVendorDashboard();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to schedule pickup");
    }
  };

  const handleUpdateEtaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!etaModalOrder) return;
    try {
      setLoadingActionId(etaModalOrder.id);
      await updatePickupEta(etaModalOrder.id, etaInput);
      toast.success(`ETA updated to ${etaInput} mins! Customer notified.`, {
        icon: "⏱️",
      });
      setEtaModalOrder(null);
      fetchVendorDashboard();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update ETA");
    } finally {
      setLoadingActionId(null);
    }
  };

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
      value: String(metrics?.upcomingPickups ?? (todayPickups.length + upcomingPickups.length)),
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
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Dashboard"
        description="Your business performance, revenue collection, and priority operational workflows."
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

      {/* ========================================================================= */}
      {/* OPERATIONAL VIEWS: PICKUP LIFECYCLE HUB (p.md)                            */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-accent">
                <Sparkles size={12} />
                Operational Views
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-text mt-1">
              Pickup & Dispatch Lifecycle
            </h2>
          </div>

          {/* Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-surface/80 p-1.5 rounded-2xl border border-border">
            <button
              onClick={() => setActiveTab("today")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "today"
                  ? "bg-accent text-[#141312] shadow-sm font-bold"
                  : "text-chalk hover:text-text hover:bg-white/5"
              }`}
            >
              <Clock size={14} />
              Today's Pickups
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === "today"
                    ? "bg-black/20 text-[#141312]"
                    : "bg-surface border border-border text-chalk"
                }`}
              >
                {todayPickups.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("upcoming")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "upcoming"
                  ? "bg-accent text-[#141312] shadow-sm font-bold"
                  : "text-chalk hover:text-text hover:bg-white/5"
              }`}
            >
              <Calendar size={14} />
              Upcoming Pickups
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === "upcoming"
                    ? "bg-black/20 text-[#141312]"
                    : "bg-surface border border-border text-chalk"
                }`}
              >
                {upcomingPickups.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("in_progress")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "in_progress"
                  ? "bg-indigo-500 text-white shadow-sm font-bold"
                  : "text-chalk hover:text-text hover:bg-white/5"
              }`}
            >
              <Truck size={14} />
              In Progress
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === "in_progress"
                    ? "bg-white/20 text-white"
                    : "bg-surface border border-border text-chalk"
                }`}
              >
                {inProgressPickups.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("waiting_confirmation")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "waiting_confirmation"
                  ? "bg-amber-500 text-black shadow-sm font-bold"
                  : "text-chalk hover:text-text hover:bg-white/5"
              }`}
            >
              <ShieldCheck size={14} />
              Waiting Confirmation
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === "waiting_confirmation"
                    ? "bg-black/20 text-black"
                    : "bg-surface border border-border text-chalk"
                }`}
              >
                {waitingConfirmation.length}
              </span>
            </button>
          </div>
        </div>

        {/* 1. TODAY'S PICKUPS WIDGET */}
        {activeTab === "today" && (
          <div>
            {todayPickups.length === 0 ? (
              <Panel className="p-8 text-center">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                <h3 className="text-sm font-semibold text-text">
                  No pickups scheduled for today
                </h3>
                <p className="text-xs text-chalk mt-1">
                  Upcoming bookings will appear here once their scheduled date arrives.
                </p>
              </Panel>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {todayPickups.map((order) => {
                  const firstItem = order.items?.[0];
                  const customerName =
                    order.customer?.fullName ||
                    `${order.customer?.firstName ?? ""} ${order.customer?.lastName ?? ""}`.trim() ||
                    "Customer";
                  const isScheduled = Boolean(order.pickupScheduledAt);
                  const isBusy = loadingActionId === order.id;

                  return (
                    <Panel
                      key={order.id}
                      className="border-accent/30 bg-gradient-to-br from-accent/[0.04] via-surface to-surface p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-text">
                              {order.rentalNumber}
                            </span>
                            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                              TODAY
                            </span>
                          </div>
                          <span className="text-xs font-bold text-text">
                            {formatPrice(order.grandTotal)}
                          </span>
                        </div>

                        <div className="mt-3">
                          <h4 className="font-semibold text-text text-sm">
                            {firstItem?.product?.name ?? "Equipment Rental"}
                          </h4>
                          <p className="text-xs text-chalk mt-0.5 flex items-center gap-1.5">
                            <User size={13} className="text-accent" />
                            {customerName}
                            {order.customer?.phone && (
                              <span className="text-chalk">• {order.customer.phone}</span>
                            )}
                          </p>
                        </div>

                        <div className="mt-3 rounded-xl bg-surface/60 border border-border p-3 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-chalk flex items-center gap-1">
                              <Clock size={13} className="text-accent" /> Scheduled Time
                            </span>
                            <span className="font-semibold text-text">
                              {isScheduled
                                ? new Date(order.pickupScheduledAt!).toLocaleTimeString("en-IN", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })
                                : "Needs Schedule"}
                            </span>
                          </div>
                          {order.pickupETAInMinutes && (
                            <div className="flex items-center justify-between">
                              <span className="text-chalk">ETA Window</span>
                              <span className="font-semibold text-accent">
                                {order.pickupETAInMinutes} mins
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/vendor/operations/${order.id}`}
                          className="text-xs font-semibold text-chalk hover:text-text flex items-center gap-1"
                        >
                          View Order <ChevronRight size={13} />
                        </Link>

                        <div className="flex items-center gap-2">
                          {!isScheduled ? (
                            <button
                              onClick={() => setSchedulerOrder(order)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-[#141312] hover:brightness-105"
                            >
                              <Calendar size={13} /> Schedule Pickup
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEtaModalOrder(order);
                                  setEtaInput(order.pickupETAInMinutes || 15);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-chalk hover:text-text"
                              >
                                ETA
                              </button>
                              <button
                                onClick={() => handleStartJourney(order.id)}
                                disabled={isBusy}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50"
                              >
                                {isBusy ? (
                                  <RefreshCw size={13} className="animate-spin" />
                                ) : (
                                  <Navigation size={13} />
                                )}
                                Start Journey
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </Panel>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. UPCOMING PICKUPS WIDGET */}
        {activeTab === "upcoming" && (
          <div>
            {upcomingPickups.length === 0 ? (
              <Panel className="p-8 text-center">
                <Calendar size={32} className="mx-auto text-accent mb-2" />
                <h3 className="text-sm font-semibold text-text">
                  No upcoming future pickups scheduled
                </h3>
                <p className="text-xs text-chalk mt-1">
                  Orders placed for future dates will appear here.
                </p>
              </Panel>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingPickups.map((order) => {
                  const firstItem = order.items?.[0];
                  const customerName =
                    order.customer?.fullName ||
                    `${order.customer?.firstName ?? ""} ${order.customer?.lastName ?? ""}`.trim() ||
                    "Customer";
                  const scheduledDate = order.pickupScheduledAt || order.rentalStart;

                  return (
                    <Panel key={order.id} className="p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <span className="font-mono text-xs font-bold text-chalk">
                            {order.rentalNumber}
                          </span>
                          <span className="rounded-full bg-surface border border-border px-2 py-0.5 text-[10px] font-semibold text-accent">
                            {order.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="mt-3">
                          <h4 className="font-semibold text-text text-sm line-clamp-1">
                            {firstItem?.product?.name ?? "Equipment Rental"}
                          </h4>
                          <p className="text-xs text-chalk mt-0.5">
                            Customer: {customerName}
                          </p>
                        </div>

                        <div className="mt-3 rounded-xl bg-surface/60 border border-border p-3 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-chalk flex items-center gap-1">
                              <Calendar size={13} className="text-accent" /> Date
                            </span>
                            <span className="font-semibold text-text">
                              {formatDate(scheduledDate)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-chalk flex items-center gap-1">
                              <Clock size={13} className="text-accent" /> Time
                            </span>
                            <span className="font-semibold text-text">
                              {new Date(scheduledDate).toLocaleTimeString("en-IN", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <Link
                          href={`/vendor/operations/${order.id}`}
                          className="text-xs font-semibold text-chalk hover:text-text flex items-center gap-1"
                        >
                          Details <ChevronRight size={13} />
                        </Link>
                        <button
                          onClick={() => setSchedulerOrder(order)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-accent hover:bg-white/5"
                        >
                          <Calendar size={12} />
                          {order.pickupScheduledAt ? "Reschedule" : "Schedule"}
                        </button>
                      </div>
                    </Panel>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. PICKUPS IN PROGRESS WIDGET */}
        {activeTab === "in_progress" && (
          <div>
            {inProgressPickups.length === 0 ? (
              <Panel className="p-8 text-center">
                <Truck size={32} className="mx-auto text-indigo-400 mb-2" />
                <h3 className="text-sm font-semibold text-text">
                  No pickups currently in progress
                </h3>
                <p className="text-xs text-chalk mt-1">
                  Start a journey from "Today's Pickups" to track active dispatches.
                </p>
              </Panel>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {inProgressPickups.map((order) => {
                  const firstItem = order.items?.[0];
                  const customerName =
                    order.customer?.fullName ||
                    `${order.customer?.firstName ?? ""} ${order.customer?.lastName ?? ""}`.trim() ||
                    "Customer";
                  const isBusy = loadingActionId === order.id;

                  return (
                    <Panel
                      key={order.id}
                      className="border-indigo-500/40 bg-gradient-to-br from-indigo-500/[0.08] via-surface to-surface p-5 flex flex-col justify-between shadow-lg shadow-indigo-500/5"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                            </span>
                            <span className="font-mono text-xs font-bold text-text">
                              {order.rentalNumber}
                            </span>
                            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                              JOURNEY ACTIVE
                            </span>
                          </div>

                          <span className="font-display font-bold text-sm text-indigo-300">
                            ETA: {order.pickupETAInMinutes ?? 15}m
                          </span>
                        </div>

                        <div className="mt-3">
                          <h4 className="font-semibold text-text text-base">
                            {firstItem?.product?.name ?? "Equipment Rental"}
                          </h4>
                          <p className="text-xs text-chalk mt-0.5 flex items-center gap-1.5">
                            <User size={13} className="text-accent" />
                            {customerName}
                            {order.customer?.phone && ` (${order.customer.phone})`}
                          </p>
                          <p className="text-xs text-chalk mt-1 flex items-center gap-1.5">
                            <MapPin size={13} className="text-accent" />
                            {order.deliveryAddress?.addressLine1 ||
                              order.deliveryAddress?.city ||
                              "Store Collection / Direct Handover"}
                          </p>
                        </div>

                        <div className="mt-3 text-[11px] text-chalk">
                          Started at: {formatDateTime(order.pickupStartedAt)}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/vendor/operations/${order.id}`}
                          className="text-xs font-semibold text-chalk hover:text-text"
                        >
                          Operations Page →
                        </Link>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEtaModalOrder(order);
                              setEtaInput(order.pickupETAInMinutes || 15);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-chalk hover:text-text"
                          >
                            <Clock size={12} />
                            Update ETA
                          </button>
                          <button
                            onClick={() => handleMarkArrived(order.id)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50"
                          >
                            {isBusy ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <MapPin size={13} />
                            )}
                            Mark Arrived
                          </button>
                        </div>
                      </div>
                    </Panel>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. WAITING CUSTOMER CONFIRMATION WIDGET */}
        {activeTab === "waiting_confirmation" && (
          <div>
            {waitingConfirmation.length === 0 ? (
              <Panel className="p-8 text-center">
                <ShieldCheck size={32} className="mx-auto text-amber-400 mb-2" />
                <h3 className="text-sm font-semibold text-text">
                  No orders waiting for customer confirmation
                </h3>
                <p className="text-xs text-chalk mt-1">
                  Once you arrive and complete handover, orders await customer verification here.
                </p>
              </Panel>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {waitingConfirmation.map((order) => {
                  const firstItem = order.items?.[0];
                  const customerName =
                    order.customer?.fullName ||
                    `${order.customer?.firstName ?? ""} ${order.customer?.lastName ?? ""}`.trim() ||
                    "Customer";
                  const isBusy = loadingActionId === order.id;

                  return (
                    <Panel
                      key={order.id}
                      className="border-amber-500/40 bg-gradient-to-br from-amber-500/[0.08] via-surface to-surface p-5 flex flex-col justify-between shadow-lg shadow-amber-500/5"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-text">
                              {order.rentalNumber}
                            </span>
                            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                              AWAITING CUSTOMER
                            </span>
                          </div>
                          <span className="text-xs font-bold text-text">
                            {formatPrice(order.grandTotal)}
                          </span>
                        </div>

                        <div className="mt-3">
                          <h4 className="font-semibold text-text text-base">
                            {firstItem?.product?.name ?? "Equipment Rental"}
                          </h4>
                          <p className="text-xs text-chalk mt-0.5">
                            Customer: {customerName}
                          </p>
                        </div>

                        <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200">
                          <p className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                            <ShieldCheck size={14} />
                            Arrived / Handover Stage
                          </p>
                          Customer has received notification to confirm pickup in their portal. The official rental duration timer begins once confirmed.
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <Link
                          href={`/vendor/operations/${order.id}`}
                          className="text-xs font-semibold text-chalk hover:text-text flex items-center gap-1"
                        >
                          View Details <ChevronRight size={13} />
                        </Link>

                        <button
                          onClick={() => handleCompleteHandover(order.id)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-border px-3 py-1.5 text-xs font-semibold text-text hover:bg-white/5 disabled:opacity-50"
                        >
                          {isBusy && <RefreshCw size={12} className="animate-spin" />}
                          Record Handover
                        </button>
                      </div>
                    </Panel>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* OPERATIONS TABLE & FOCUS SIDEBAR                                          */}
      {/* ========================================================================= */}
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
                {isLoading && allOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-chalk">
                      <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-accent" />
                      Loading live operations...
                    </td>
                  </tr>
                ) : allOrders.length > 0 ? (
                  allOrders.slice(0, 8).map((op) => {
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
                          {formatDate(op.rentalStart)} → {formatDate(op.rentalEnd)}
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
                {todayPickups.length} pickup(s) scheduled today
              </p>
              <p className="text-chalk text-[11px] mt-0.5">
                Verify asset condition and start journey on schedule.
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
                Deposits are reconciled upon item return inspection.
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

      {/* Pickup Scheduler Modal */}
      {schedulerOrder && (
        <PickupSchedulerModal
          isOpen={Boolean(schedulerOrder)}
          onClose={() => setSchedulerOrder(null)}
          onSchedule={handleScheduleSubmit}
          initialDate={schedulerOrder.pickupScheduledAt || schedulerOrder.rentalStart}
        />
      )}

      {/* Quick ETA Modal */}
      {etaModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Clock size={16} className="text-accent" />
                Update Estimated Arrival (ETA)
              </h3>
              <button
                onClick={() => setEtaModalOrder(null)}
                className="text-chalk hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEtaSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs text-chalk mb-1">
                  Estimated Arrival (Minutes)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[10, 15, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setEtaInput(mins)}
                      className={`rounded-lg py-1.5 text-xs font-semibold border ${
                        etaInput === mins
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-white/10 bg-white/5 text-chalk hover:text-white"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={240}
                  required
                  value={etaInput}
                  onChange={(e) => setEtaInput(parseInt(e.target.value, 10) || 15)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEtaModalOrder(null)}
                  className="rounded-xl border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-chalk hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingActionId === etaModalOrder.id}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-1.5 text-xs font-bold text-[#141312] hover:brightness-105"
                >
                  {loadingActionId === etaModalOrder.id && (
                    <RefreshCw size={12} className="animate-spin" />
                  )}
                  Save & Notify Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
