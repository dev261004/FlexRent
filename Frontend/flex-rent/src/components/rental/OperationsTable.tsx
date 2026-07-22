"use client";

import { useEffect, useState } from "react";
import { Ban, CheckCircle2, RotateCcw, Truck, WalletCards } from "lucide-react";
import { getOrders, markOrderPickedUp, markOrderReturned, type RentalOrder } from "@/features/customer/api";
import { acceptOrder, rejectOrder, rejectPayment, verifyPayment } from "@/features/rentals/api";
import { Panel } from "@/components/admin/Panel";

const statusStyle: Record<string, string> = {
  QUOTATION: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  CONFIRMED: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  PICKED_UP: "bg-accent/15 text-yellow-800 dark:text-accent",
  RETURNED: "bg-green-500/15 text-green-700 dark:text-green-300",
  CANCELLED: "bg-black/5 text-chalk dark:bg-white/10",
};

const label = (status: string) =>
  status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export function OperationsTable() {
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getOrders()
      .then((data) => setOrders(data.rentalOrders ?? data.orders ?? []))
      .catch(() => setError("Could not load rental orders."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const replaceOrder = (updated: RentalOrder) => {
    setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const run = async (order: RentalOrder, action: string, fn: () => Promise<RentalOrder | unknown>) => {
    setBusy(`${order.id}:${action}`);
    setError("");
    try {
      const result = await fn();
      if (result && typeof result === "object" && "id" in result) {
        replaceOrder(result as RentalOrder);
      } else {
        load();
      }
    } catch {
      setError(`Unable to ${action} this order.`);
    } finally {
      setBusy(null);
    }
  };

  const actionable = orders.filter((order) =>
    ["QUOTATION", "CONFIRMED", "PICKED_UP"].includes(order.status) ||
    order.paymentStatus === "PAYMENT_SUBMITTED"
  );

  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-border px-5 py-5">
        <h2 className="font-display text-lg font-bold text-text">Live rental operations</h2>
        <p className="mt-1 text-sm text-chalk">Accept requests, verify payments, and track pickup and return.</p>
      </div>
      {error && <p className="mx-5 mt-4 rounded-xl bg-danger/10 p-3 text-sm text-red-600 dark:text-red-300">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border bg-black/[.02] text-left text-xs uppercase tracking-wide text-chalk dark:bg-white/[.02]">
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Rental period</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-10 text-center text-chalk">Loading orders...</td></tr>
            ) : actionable.length === 0 ? (
              <tr><td colSpan={7} className="p-10 text-center text-chalk">No active customer bookings yet.</td></tr>
            ) : actionable.map((order) => (
              <tr key={order.id} className="border-t border-border/60">
                <td className="px-5 py-4 font-mono text-xs font-bold text-text">{order.rentalNumber}</td>
                <td className="px-5 py-4 text-text">{order.customer?.fullName ?? ([order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" ") || "Customer")}</td>
                <td className="px-5 py-4 text-text">{order.items.map((item) => item.product.name).join(", ")}</td>
                <td className="px-5 py-4 text-chalk">{new Date(order.rentalStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - {new Date(order.rentalEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[order.status] ?? statusStyle.QUOTATION}`}>{label(order.status)}</span></td>
                <td className="px-5 py-4"><span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-bold text-chalk dark:bg-white/10">{label(order.paymentStatus)}</span></td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {order.status === "QUOTATION" && (
                      <>
                        <button disabled={busy !== null} onClick={() => run(order, "accept", () => acceptOrder(order.id))} className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-black"><CheckCircle2 size={14}/>Accept</button>
                        <button disabled={busy !== null} onClick={() => run(order, "reject", () => rejectOrder(order.id, window.prompt("Reason for rejection") || "Product unavailable"))} className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-600"><Ban size={14}/>Reject</button>
                      </>
                    )}
                    {order.paymentStatus === "PAYMENT_SUBMITTED" && (
                      <>
                        <button disabled={busy !== null} onClick={() => run(order, "verify payment", () => verifyPayment(order.id))} className="inline-flex items-center gap-1 rounded-lg bg-green-500 px-3 py-2 text-xs font-bold text-white"><WalletCards size={14}/>Verify</button>
                        <button disabled={busy !== null} onClick={() => run(order, "reject payment", () => rejectPayment(order.id, window.prompt("Payment rejection remarks") || "Invalid transaction"))} className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-600">Reject pay</button>
                      </>
                    )}
                    {order.status === "CONFIRMED" && <button disabled={busy !== null} onClick={() => run(order, "mark as picked up", () => markOrderPickedUp(order.id))} className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-black"><Truck size={14}/>Pickup</button>}
                    {order.status === "PICKED_UP" && <button disabled={busy !== null} onClick={() => run(order, "mark as returned", () => markOrderReturned(order.id))} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-bold text-text hover:border-accent"><RotateCcw size={14}/>Return</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-5 py-3 text-right">
        <span className="inline-flex items-center gap-1 text-xs text-chalk"><CheckCircle2 size={14} className="text-green-500"/>Live API data</span>
      </div>
    </Panel>
  );
}
