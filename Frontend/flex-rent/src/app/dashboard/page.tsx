"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Truck,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Package,
  RotateCcw,
  FileText,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Download,
  Calendar,
  ChevronRight,
  Store,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  getOrders,
  confirmPickupCustomer,
  downloadRentalOrderInvoice,
  type RentalOrder,
} from "@/features/customer/api";
import { Panel } from "@/components/admin/Panel";
import { RentalExtensionModal } from "@/components/orders/RentalExtensionModal";
import { getProductImageUrl } from "@/core/image";

const money = (value?: string | number | null) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

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

const getTimeRemaining = (rentalEnd: string) => {
  const diffMs = new Date(rentalEnd).getTime() - Date.now();
  if (diffMs <= 0) return { expired: true, text: "Return Due Now" };
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return { expired: false, text: `${days}d ${hours}h remaining` };
  return { expired: false, text: `${hours}h remaining` };
};

export default function CustomerDashboardPage() {
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [extensionOrder, setExtensionOrder] = useState<RentalOrder | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data.rentalOrders ?? data.orders ?? []);
    } catch {
      setOrders([]);
      toast.error("Failed to load rental orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Operational Lifecycle Segments (p.md)
  // 1. Vendor Arrived (Action Required by Customer)
  const arrivedOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        ((o.status === "PICKUP_IN_PROGRESS" && Boolean(o.pickupArrivedAt)) ||
          o.status === "PICKED_UP") &&
        !o.pickupConfirmedByCustomer &&
        o.status !== "ACTIVE"
    );
  }, [orders]);

  // 2. Vendor On The Way
  const onTheWayOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === "PICKUP_IN_PROGRESS" &&
        !o.pickupArrivedAt &&
        !o.pickupConfirmedByCustomer
    );
  }, [orders]);

  // 3. Upcoming Pickups
  const upcomingPickups = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === "PICKUP_SCHEDULED" ||
        (o.status === "CONFIRMED" &&
          !o.pickupStartedAt &&
          new Date(o.rentalStart).getTime() >= Date.now() - 24 * 60 * 60 * 1000)
    );
  }, [orders]);

  // 4. Rental Active
  const activeRentals = useMemo(() => {
    return orders.filter(
      (o) => o.status === "ACTIVE" || (o.pickupConfirmedByCustomer && o.status !== "RETURNED" && o.status !== "CANCELLED")
    );
  }, [orders]);

  // Quick action: Customer confirms pickup
  const handleConfirmPickup = async (orderId: string) => {
    try {
      setConfirmingId(orderId);
      await confirmPickupCustomer(orderId, "Confirmed via customer dashboard");
      toast.success("Pickup confirmed! Your rental period is now officially active.", {
        duration: 4500,
        icon: "🎉",
      });
      fetchOrders();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to confirm pickup. Please try again."
      );
    } finally {
      setConfirmingId(null);
    }
  };

  // Quick action: Download invoice
  const handleDownloadInvoice = async (orderId: string) => {
    try {
      setDownloadingId(orderId);
      await downloadRentalOrderInvoice(orderId, true);
    } catch {
      toast.error("Failed to generate invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
              <Sparkles size={13} />
              Customer Operations Hub
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-text sm:text-4xl">
            Everything, right on schedule.
          </h1>
          <p className="mt-2 text-sm text-chalk">
            Real-time delivery progress, active rental timers, and quick order actions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-text hover:bg-white/5 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-accent" : ""} />
            Refresh
          </button>
          <Link
            href="/dashboard/catalog"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-[#1a1817] shadow-lg shadow-accent/20 hover:brightness-105 transition"
          >
            Browse rentals <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-chalk">
                Active Rentals
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-text">
                {loading ? "—" : activeRentals.length}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/15 p-3 text-emerald-400">
              <Package size={22} />
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-chalk">
                Incoming Pickups
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-text">
                {loading ? "—" : onTheWayOrders.length + upcomingPickups.length}
              </p>
            </div>
            <div className="rounded-xl bg-indigo-500/15 p-3 text-indigo-400">
              <Truck size={22} />
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-chalk">
                Awaiting Confirm
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-amber-400">
                {loading ? "—" : arrivedOrders.length}
              </p>
            </div>
            <div className="rounded-xl bg-amber-500/15 p-3 text-amber-400">
              <ShieldCheck size={22} />
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-chalk">
                Completed
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-text">
                {loading
                  ? "—"
                  : orders.filter((o) => o.status === "RETURNED").length}
              </p>
            </div>
            <div className="rounded-xl bg-accent/15 p-3 text-accent">
              <RotateCcw size={22} />
            </div>
          </div>
        </Panel>
      </div>

      {/* ========================================================================= */}
      {/* 1. OPERATIONAL WIDGET: VENDOR ARRIVED (ACTION REQUIRED)                   */}
      {/* ========================================================================= */}
      {arrivedOrders.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <h2 className="font-display text-lg font-bold text-amber-400 flex items-center gap-2">
              <MapPin size={20} />
              Vendor Arrived — Action Required
            </h2>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400">
              {arrivedOrders.length} pending
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {arrivedOrders.map((order) => {
              const firstItem = order.items?.[0];
              const isConfirming = confirmingId === order.id;

              return (
                <Panel
                  key={order.id}
                  className="relative overflow-hidden border-amber-500/40 bg-gradient-to-br from-amber-500/[0.07] via-surface to-surface p-6 shadow-xl shadow-amber-500/5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      {firstItem?.product?.primaryImage?.url ? (
                        <img
                          src={getProductImageUrl(firstItem.product.primaryImage.url)}
                          alt={firstItem.product.name}
                          className="h-16 w-16 rounded-xl border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                          <Package size={28} />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-chalk">
                            {order.rentalNumber}
                          </span>
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                            ARRIVED
                          </span>
                        </div>
                        <h3 className="mt-1 font-semibold text-text text-base">
                          {firstItem?.product?.name ?? "Equipment Rental"}
                          {order.items?.length > 1 && (
                            <span className="text-xs text-chalk ml-1.5 font-normal">
                              (+{order.items.length - 1} more items)
                            </span>
                          )}
                        </h3>
                        <p className="mt-1 text-xs text-chalk flex items-center gap-1.5">
                          <Clock size={13} className="text-amber-400" />
                          Arrived at {formatDateTime(order.pickupArrivedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:text-right">
                      <p className="text-xs text-chalk">Total Rental</p>
                      <p className="font-bold text-text text-lg">
                        {money(order.grandTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                    <p className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                      <ShieldCheck size={16} />
                      Handover Ready
                    </p>
                    Please inspect your equipment. Confirming pickup will verify possession and officially start your rental duration timer.
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-xs font-semibold text-chalk hover:text-text flex items-center gap-1 transition"
                    >
                      View Full Details <ChevronRight size={14} />
                    </Link>

                    <button
                      onClick={() => handleConfirmPickup(order.id)}
                      disabled={isConfirming}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 px-5 py-2.5 text-xs font-bold text-[#141312] shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:opacity-50 transition"
                    >
                      {isConfirming ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Activating Rental...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={15} />
                          Confirm Pickup & Start Rental
                        </>
                      )}
                    </button>
                  </div>
                </Panel>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. OPERATIONAL WIDGET: VENDOR ON THE WAY                                  */}
      {/* ========================================================================= */}
      {onTheWayOrders.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
              <Truck size={20} className="text-indigo-400" />
              Vendor On The Way
            </h2>
            <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-bold text-indigo-400">
              {onTheWayOrders.length} active journey
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {onTheWayOrders.map((order) => {
              const firstItem = order.items?.[0];
              const etaMinutes = order.pickupETAInMinutes || 15;

              return (
                <Panel
                  key={order.id}
                  className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/[0.06] via-surface to-surface p-6 shadow-xl shadow-indigo-500/5"
                >
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                        <Truck size={24} className="animate-pulse" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-chalk">
                          {order.rentalNumber}
                        </span>
                        <h3 className="font-semibold text-text text-base">
                          {firstItem?.product?.name ?? "Equipment Rental"}
                        </h3>
                      </div>
                    </div>

                    <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-3.5 py-1.5 text-right">
                      <p className="text-[10px] uppercase font-bold text-indigo-400">
                        Estimated ETA
                      </p>
                      <p className="font-display text-base font-extrabold text-white">
                        ~{etaMinutes} mins
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-chalk">Journey Started</p>
                      <p className="font-medium text-text mt-0.5">
                        {formatDateTime(order.pickupStartedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-chalk">Fulfillment Method</p>
                      <p className="font-medium text-text mt-0.5 flex items-center gap-1">
                        {order.deliveryAddress ? (
                          <>
                            <MapPin size={13} className="text-accent" /> Delivery
                          </>
                        ) : (
                          <>
                            <Store size={13} className="text-accent" /> Store Collection
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <p className="text-xs text-indigo-300 flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      En route to your handover location
                    </p>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-text hover:bg-white/10 transition"
                    >
                      Track Live Timeline <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </Panel>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. OPERATIONAL WIDGET: UPCOMING PICKUP                                    */}
      {/* ========================================================================= */}
      {upcomingPickups.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
              <CalendarDays size={20} className="text-accent" />
              Upcoming Pickups & Dispatches
            </h2>
            <span className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-xs font-semibold text-chalk">
              {upcomingPickups.length} scheduled
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingPickups.map((order) => {
              const firstItem = order.items?.[0];
              const scheduledAt = order.pickupScheduledAt || order.rentalStart;

              return (
                <Panel key={order.id} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="font-mono text-xs font-bold text-chalk">
                        {order.rentalNumber}
                      </span>
                      <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold text-accent uppercase">
                        {order.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="mt-3 flex items-start gap-3">
                      {firstItem?.product?.primaryImage?.url ? (
                        <img
                          src={getProductImageUrl(firstItem.product.primaryImage.url)}
                          alt={firstItem.product.name}
                          className="h-12 w-12 rounded-lg border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface border border-border text-chalk">
                          <Package size={20} />
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-semibold text-text line-clamp-1">
                          {firstItem?.product?.name ?? "Equipment Rental"}
                        </h4>
                        <p className="text-xs text-chalk mt-0.5">
                          Qty: {firstItem?.quantity ?? 1} • {money(order.grandTotal)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-surface/60 border border-border p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-chalk flex items-center gap-1">
                          <Calendar size={13} className="text-accent" /> Scheduled Date
                        </span>
                        <span className="font-semibold text-text">
                          {formatDate(scheduledAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-chalk flex items-center gap-1">
                          <Clock size={13} className="text-accent" /> Time Window
                        </span>
                        <span className="font-semibold text-text">
                          {new Date(scheduledAt).toLocaleTimeString("en-IN", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-chalk">
                      Vendor: {order.vendor?.companyName || order.vendor?.fullName || "FlexRent Partner"}
                    </span>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                    >
                      View Details <ChevronRight size={13} />
                    </Link>
                  </div>
                </Panel>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. OPERATIONAL WIDGET: RENTAL ACTIVE                                      */}
      {/* ========================================================================= */}
      {activeRentals.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-400" />
              Active Rentals (In Possession)
            </h2>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
              {activeRentals.length} active
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {activeRentals.map((order) => {
              const firstItem = order.items?.[0];
              const remaining = getTimeRemaining(order.rentalEnd);
              const isDownloading = downloadingId === order.id;

              return (
                <Panel
                  key={order.id}
                  className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.05] via-surface to-surface p-6 shadow-xl shadow-emerald-500/5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-4">
                    <div className="flex items-start gap-4">
                      {firstItem?.product?.primaryImage?.url ? (
                        <img
                          src={getProductImageUrl(firstItem.product.primaryImage.url)}
                          alt={firstItem.product.name}
                          className="h-16 w-16 rounded-xl border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                          <Package size={28} />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-chalk">
                            {order.rentalNumber}
                          </span>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            RENTAL ACTIVE
                          </span>
                        </div>
                        <h3 className="mt-1 font-semibold text-text text-base">
                          {firstItem?.product?.name ?? "Equipment Rental"}
                        </h3>
                        <p className="text-xs text-chalk mt-0.5">
                          Started: {formatDate(order.actualPickupAt || order.rentalStart)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-right">
                      <p className="text-[10px] uppercase font-bold text-emerald-400">
                        Time Remaining
                      </p>
                      <p
                        className={`font-display text-sm font-extrabold ${
                          remaining.expired ? "text-amber-400" : "text-white"
                        }`}
                      >
                        {remaining.text}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-chalk">Return Due Date</p>
                      <p className="font-semibold text-text mt-0.5">
                        {formatDateTime(order.rentalEnd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-chalk">Security Deposit Held</p>
                      <p className="font-semibold text-text mt-0.5 text-accent">
                        {money(order.securityDepositAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadInvoice(order.id)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-chalk hover:bg-white/5 hover:text-text transition"
                        title="Download official tax invoice"
                      >
                        <Download size={13} className={isDownloading ? "animate-spin" : ""} />
                        Invoice
                      </button>

                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-chalk hover:bg-white/5 hover:text-text transition"
                      >
                        Details
                      </Link>
                    </div>

                    <button
                      onClick={() => setExtensionOrder(order)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-[#1a1817] shadow-md shadow-accent/20 hover:brightness-105 transition"
                    >
                      <Clock size={13} />
                      Request Extension
                    </button>
                  </div>
                </Panel>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. ALL RECENT BOOKINGS TABLE                                              */}
      {/* ========================================================================= */}
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-text">
              All Recent Bookings
            </h2>
            <p className="mt-1 text-sm text-chalk">
              Live rental orders from your account across all lifecycle stages.
            </p>
          </div>
          <Link
            href="/dashboard/orders"
            className="text-sm font-bold text-accent hover:underline flex items-center gap-1"
          >
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {!loading && orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={36} className="mx-auto text-accent mb-3" />
            <h3 className="font-semibold text-text text-base">No bookings yet</h3>
            <p className="text-xs text-chalk mt-1">
              Start browsing our catalog to rent premium equipment.
            </p>
            <Link
              href="/dashboard/catalog"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-[#1a1817]"
            >
              Browse Rentals <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.slice(0, 8).map((order) => {
              const firstItem = order.items?.[0];
              return (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition hover:bg-accent/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface border border-border text-accent">
                      <Package size={18} />
                    </div>
                    <div>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-semibold text-text hover:text-accent text-sm"
                      >
                        {firstItem?.product?.name ?? order.rentalNumber}
                      </Link>
                      <p className="mt-0.5 text-xs text-chalk">
                        {formatDate(order.rentalStart)} – {formatDate(order.rentalEnd)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold text-text text-sm">
                        {money(order.grandTotal)}
                      </p>
                      <p className="text-[11px] text-chalk font-mono">
                        #{order.rentalNumber}
                      </p>
                    </div>

                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
                        order.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : order.status === "PICKUP_IN_PROGRESS"
                          ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                          : order.status === "PICKUP_SCHEDULED"
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : order.status === "RETURNED"
                          ? "bg-white/10 text-chalk"
                          : "bg-surface text-chalk border border-border"
                      }`}
                    >
                      {order.status.replace("_", " ")}
                    </span>

                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="rounded-lg p-2 text-chalk hover:bg-white/5 hover:text-text"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Rental Extension Modal */}
      {extensionOrder && (
        <RentalExtensionModal
          order={extensionOrder}
          isOpen={Boolean(extensionOrder)}
          onClose={() => setExtensionOrder(null)}
          onSuccess={() => {
            setExtensionOrder(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
