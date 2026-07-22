"use client";

import Link from "next/link";
import { CalendarRange, Clipboard, PackageSearch, QrCode, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { getOrders, type RentalOrder } from "@/features/customer/api";
import { getPaymentQR, getTimeline, submitUpiPayment, type PaymentQR } from "@/features/rentals/api";
import { Panel } from "@/components/admin/Panel";

const money = (value: string | number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));

export default function OrdersPage() {
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [qr, setQr] = useState<{ orderId: string; data: PaymentQR } | null>(null);
  const [utr, setUtr] = useState("");
  const [proof, setProof] = useState("");
  const [timeline, setTimeline] = useState<{ orderId: string; events: Array<{ label: string; date: string | null; completed: boolean }> } | null>(null);

  const load = () => {
    setLoading(true);
    getOrders()
      .then((data) => setOrders(data.rentalOrders ?? data.orders ?? []))
      .catch(() => setError("Could not load bookings."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  async function openQr(order: RentalOrder) {
    setBusy(order.id);
    setError("");
    try {
      setQr({ orderId: order.id, data: await getPaymentQR(order.id) });
      setUtr("");
      setProof("");
    } catch {
      setError("Payment QR is available only after vendor acceptance and before payment completion.");
    } finally {
      setBusy(null);
    }
  }

  async function submitPayment(orderId: string) {
    setBusy(orderId);
    setError("");
    try {
      await submitUpiPayment(orderId, { transactionId: utr, paymentProof: proof || undefined });
      setQr(null);
      load();
    } catch {
      setError("Could not submit payment. Check UTR and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function openTimeline(orderId: string) {
    setBusy(orderId);
    try {
      const data = await getTimeline(orderId);
      setTimeline({ orderId, events: data.events });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">Rental history</p>
        <h1 className="font-display text-3xl font-bold text-text sm:text-4xl">My bookings</h1>
        <p className="mt-2 text-sm text-chalk">Track booking requests, pay by UPI, and follow pickup/return progress.</p>
      </div>
      {error && <p className="mb-4 rounded-xl bg-danger/10 p-3 text-sm text-red-600 dark:text-red-300">{error}</p>}
      <Panel className="overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-chalk">Loading bookings...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center"><PackageSearch className="mx-auto text-accent" size={32} /><p className="mt-4 font-semibold text-text">Your booking history is empty.</p><Link className="mt-3 inline-block text-sm font-bold text-accent" href="/dashboard/catalog">Browse available rentals</Link></div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex gap-3">
                  <div className="rounded-xl bg-accent/15 p-3 text-accent"><CalendarRange size={20} /></div>
                  <div>
                    <p className="font-display font-bold text-text">{order.items.map((item) => item.product.name).join(", ")}</p>
                    <p className="mt-1 text-sm text-chalk">{order.rentalNumber} · {new Date(order.rentalStart).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} - {new Date(order.rentalEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <p className="mt-1 text-xs text-chalk">{order.vendor?.companyName ?? order.vendor?.fullName ?? "Rental partner"}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 xl:items-end">
                  <p className="font-bold text-text">{money(order.grandTotal)}</p>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <span className="rounded-full bg-accent/15 px-2 py-1 text-[11px] font-bold text-accent">{order.status.replaceAll("_", " ")}</span>
                    <span className="rounded-full bg-black/5 px-2 py-1 text-[11px] font-bold text-chalk dark:bg-white/10">{order.paymentStatus.replaceAll("_", " ")}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {order.status === "CONFIRMED" && order.paymentStatus !== "PAID" && (
                      <button disabled={busy === order.id} onClick={() => void openQr(order)} className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-black"><QrCode size={14} />Pay UPI</button>
                    )}
                    <button disabled={busy === order.id} onClick={() => void openTimeline(order.id)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-bold text-text"><RefreshCw size={14} />Timeline</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {qr && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="mx-auto my-8 max-w-lg rounded-2xl border border-border bg-surface-raised p-5 shadow-2xl">
            <h2 className="font-display text-xl font-bold text-text">UPI payment</h2>
            <p className="mt-2 text-sm text-chalk">Use this link to generate a QR in the frontend or open any UPI app.</p>
            <div className="mt-4 rounded-xl bg-surface p-4 text-sm">
              <p className="font-bold text-text">{money(qr.data.amount)} to {qr.data.vendorName}</p>
              <p className="mt-1 text-chalk">{qr.data.upiId}</p>
              <button type="button" onClick={() => navigator.clipboard.writeText(qr.data.upiLink)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold text-text"><Clipboard size={14} />Copy UPI link</button>
            </div>
            <label className="mt-4 block text-sm font-semibold text-text">UTR / Transaction ID<input value={utr} onChange={(event) => setUtr(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text" /></label>
            <label className="mt-4 block text-sm font-semibold text-text">Payment proof URL<input value={proof} onChange={(event) => setProof(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text" /></label>
            <div className="mt-5 flex gap-2">
              <button disabled={utr.length < 8 || busy === qr.orderId} onClick={() => void submitPayment(qr.orderId)} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50">Submit payment</button>
              <button onClick={() => setQr(null)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-text">Close</button>
            </div>
          </div>
        </div>
      )}

      {timeline && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="mx-auto my-8 max-w-lg rounded-2xl border border-border bg-surface-raised p-5 shadow-2xl">
            <h2 className="font-display text-xl font-bold text-text">Rental timeline</h2>
            <div className="mt-5 space-y-3">
              {timeline.events.map((event) => (
                <div key={event.label} className="flex items-center justify-between rounded-xl bg-surface p-3">
                  <span className="font-semibold text-text">{event.label}</span>
                  <span className="text-xs text-chalk">{event.date ? new Date(event.date).toLocaleString("en-IN") : event.completed ? "Done" : "Pending"}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setTimeline(null)} className="mt-5 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-text">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
