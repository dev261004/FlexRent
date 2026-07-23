"use client";

import Link from "next/link";
import { CalendarRange, Clipboard, ExternalLink, PackageSearch, QrCode, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { getOrders, type RentalOrder } from "@/features/customer/api";
import { getPaymentQR, getTimeline, submitUpiPayment, type PaymentQR } from "@/features/rentals/api";
import { Panel } from "@/components/admin/Panel";

const money = (value: string | number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));

const normalizeStatus = (value?: string | null) => (value ?? "").trim().toUpperCase();

const canPayOrder = (order: RentalOrder) => {
  const status = normalizeStatus(order.status);
  const paymentStatus = normalizeStatus(order.paymentStatus);
  const isAccepted = status === "CONFIRMED" || status === "APPROVED" || Boolean(order.approvedAt);
  const isPaymentOpen = !["PAID", "PAYMENT_SUBMITTED"].includes(paymentStatus);

  return isAccepted && isPaymentOpen;
};

const getVendorName = (order: RentalOrder) => {
  const vendorName = order.vendor?.companyName ?? order.vendor?.fullName ?? "";

  return vendorName.trim().toLowerCase() === "string" || !vendorName.trim()
    ? "Rental partner"
    : vendorName;
};

const getPayeeName = (vendorName: string) =>
  vendorName.trim().toLowerCase() === "string" || !vendorName.trim()
    ? "Rental partner"
    : vendorName;

const getQrCodeUrl = (upiLink: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(upiLink)}`;

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
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Payment QR is available only after vendor acceptance and before payment completion.");
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
                <Link href={`/dashboard/orders/${order.id}`} className="flex gap-3 transition hover:opacity-85">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent"><CalendarRange size={22} /></div>
                  <div>
                    <p className="font-display font-bold text-text">{order.items.map((item) => item.product.name).join(", ")}</p>
                    <p className="mt-1 text-sm text-chalk">{order.rentalNumber} · {new Date(order.rentalStart).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} - {new Date(order.rentalEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <p className="mt-1 text-xs text-chalk">{getVendorName(order)}</p>
                  </div>
                </Link>
                <div className="flex flex-col gap-3 xl:items-end">
                  <p className="font-bold text-text">{money(order.grandTotal)}</p>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <span className="rounded-full bg-accent/15 px-2 py-1 text-[11px] font-bold text-accent">{order.status.replaceAll("_", " ")}</span>
                    <span className="rounded-full bg-black/5 px-2 py-1 text-[11px] font-bold text-chalk dark:bg-white/10">{order.paymentStatus.replaceAll("_", " ")}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {canPayOrder(order) && (
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
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="mx-auto my-8 w-full max-w-md rounded-2xl border border-border bg-surface-raised p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-text">UPI Payment</h2>
              <button onClick={() => setQr(null)} className="text-chalk hover:text-text">
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center rounded-xl bg-surface p-6 border border-border/50 text-center">
              <div className="rounded-xl bg-white p-2">
                <img src={getQrCodeUrl(qr.data.upiLink)} alt="UPI QR code" className="h-[200px] w-[200px]" />
              </div>
              <p className="mt-4 font-display text-2xl font-bold text-text">{money(qr.data.amount)}</p>
              <p className="text-sm font-medium text-chalk">to {getPayeeName(qr.data.vendorName)}</p>
              <p className="mt-1 text-xs text-chalk/70">{qr.data.upiId}</p>

              <div className="mt-5 flex w-full gap-2">
                <a href={qr.data.upiLink} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-sm font-bold text-black transition hover:bg-accent/90">
                  <ExternalLink size={16} /> Open App
                </a>
                <button type="button" onClick={() => navigator.clipboard.writeText(qr.data.upiLink)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm font-bold text-text transition hover:bg-surface">
                  <Clipboard size={16} /> Copy UPI ID
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-chalk">UTR / Transaction ID *</span>
                <input value={utr} onChange={(event) => setUtr(event.target.value)} placeholder="Enter 12-digit UTR" className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition focus:border-accent" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-chalk">Payment Proof URL (Optional)</span>
                <input value={proof} onChange={(event) => setProof(event.target.value)} placeholder="https://..." className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition focus:border-accent" />
              </label>
              <button disabled={utr.length < 8 || busy === qr.orderId} onClick={() => void submitPayment(qr.orderId)} className="mt-2 w-full rounded-xl bg-accent px-4 py-3.5 text-sm font-bold text-black transition hover:bg-accent/90 disabled:opacity-50">
                Verify Payment
              </button>
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