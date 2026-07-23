"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarRange, CheckCircle2, Clipboard, CreditCard, MapPin, Package, QrCode, Store, Truck, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/admin/Panel";
import { getOrder, type RentalOrder } from "@/features/customer/api";
import { getPaymentQR, getTimeline, submitUpiPayment, type PaymentQR } from "@/features/rentals/api";

const money = (value?: string | number | null) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value ?? 0));

const date = (value?: string | null) =>
  value ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "-";

const label = (value?: string | null) => (value ?? "-").replaceAll("_", " ");

const fallbackImage = "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80";

const steps = [
  { key: "QUOTATION", label: "Requested" },
  { key: "CONFIRMED", label: "Accepted" },
  { key: "PAYMENT_SUBMITTED", label: "Payment submitted" },
  { key: "PAID", label: "Payment verified" },
  { key: "PICKED_UP", label: "Picked up" },
  { key: "RETURNED", label: "Returned" },
];

const getQrCodeUrl = (upiLink: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(upiLink)}`;

const parseBookingNotes = (notes?: string | null) => {
  const text = notes ?? "";
  const address = text.match(/Delivery address:\s*(.*?)(?:\. Payment preference:|$)/i)?.[1]?.trim();
  const paymentPreference = text.match(/Payment preference:\s*(.*?)(?:\.|$)/i)?.[1]?.trim();
  const storeCollection = /Store collection selected/i.test(text);

  return {
    address: address || null,
    paymentPreference: paymentPreference || null,
    fulfilment: address ? "Delivery" : storeCollection ? "Store collection" : "Not specified",
  };
};

const canPayOrder = (order: RentalOrder) =>
  (["CONFIRMED", "APPROVED"].includes(order.status) || Boolean(order.approvedAt)) &&
  !["PAID", "PAYMENT_SUBMITTED"].includes(order.paymentStatus);

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const [order, setOrder] = useState<RentalOrder | null>(null);
  const [timeline, setTimeline] = useState<Array<{ label: string; status?: string; date: string | null; completed: boolean }>>([]);
  const [qr, setQr] = useState<PaymentQR | null>(null);
  const [utr, setUtr] = useState("");
  const [proof, setProof] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const booking = useMemo(() => parseBookingNotes(order?.notes), [order?.notes]);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      getOrder(orderId),
      getTimeline(orderId).catch(() => ({ events: [] })),
    ])
      .then(([orderData, timelineData]) => {
        setOrder(orderData);
        setTimeline(timelineData.events ?? []);
      })
      .catch(() => setError("Could not load order details."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [orderId]);

  async function openQr() {
    if (!order) return;
    setBusy(true);
    setError("");
    try {
      setQr(await getPaymentQR(order.id));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not generate UPI QR.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPayment() {
    if (!order) return;
    setBusy(true);
    setError("");
    try {
      await submitUpiPayment(order.id, { transactionId: utr, paymentProof: proof || undefined });
      setQr(null);
      setUtr("");
      setProof("");
      load();
    } catch {
      setError("Could not submit payment. Check the UTR and try again.");
      setBusy(false);
    }
  }

  if (loading) return <div className="text-sm text-chalk">Loading order details...</div>;
  if (!order) return <div className="text-sm text-chalk">Order not found.</div>;

  const primaryItem = order.items[0];
  const vendorName = order.vendor?.companyName ?? order.vendor?.fullName ?? "Rental partner";

  return (
    <div className="space-y-6">
      <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-sm font-bold text-accent">
        <ArrowLeft size={16} /> Back to bookings
      </Link>

      {error && <p className="rounded-xl bg-danger/10 p-3 text-sm text-red-600 dark:text-red-300">{error}</p>}

      <Panel className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Order details</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-text">{order.rentalNumber}</h1>
            <p className="mt-2 text-sm text-chalk">{date(order.rentalStart)} - {date(order.rentalEnd)}</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <StatusPill label={label(order.status)} />
            <StatusPill label={label(order.paymentStatus)} muted />
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Metric label="Total" value={money(order.grandTotal)} />
          <Metric label="Subtotal" value={money(order.subtotal)} />
          <Metric label="Deposit" value={money(order.securityDepositAmount)} />
          <Metric label="Late fee" value={money(order.lateFee)} />
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionTitle icon={<Truck size={19} />} title="Progress" />
        <div className="mt-5 grid gap-3 md:grid-cols-6">
          {steps.map((step) => {
            const done =
              order.status === step.key ||
              order.paymentStatus === step.key ||
              timeline.some((event) => event.status === step.key || (event.label.toUpperCase().includes(step.label.toUpperCase().split(" ")[0]) && event.completed));

            return (
              <div key={step.key} className={`rounded-xl border p-3 ${done ? "border-accent bg-accent/10 text-text" : "border-border text-chalk"}`}>
                <CheckCircle2 size={17} className={done ? "text-accent" : "text-chalk"} />
                <p className="mt-2 text-xs font-bold">{step.label}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-5 space-y-2">
          {timeline.map((event) => (
            <div key={event.label} className="flex items-center justify-between rounded-xl bg-surface p-3 text-sm">
              <span className="font-semibold text-text">{event.label}</span>
              <span className="text-xs text-chalk">{event.date ? date(event.date) : event.completed ? "Done" : "Pending"}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Panel className="p-6">
          <SectionTitle icon={<Package size={19} />} title="Product details" />
          <div className="mt-5 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-xl bg-surface p-3">
                <img src={item.product.primaryImage?.url ?? fallbackImage} alt={item.product.primaryImage?.altText ?? item.product.name} className="h-24 w-28 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-text">{item.product.name}</p>
                  <p className="mt-1 text-xs text-chalk">{item.product.category?.name ?? "Rental product"}</p>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                    <Detail label="Quantity" value={String(item.quantity)} />
                    <Detail label="Rental price" value={money(item.rentalPrice)} />
                    <Detail label="Line total" value={money(item.subtotal)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionTitle icon={<MapPin size={19} />} title="Delivery / pickup" />
          <div className="mt-5 grid gap-4">
            <Detail label="Fulfilment" value={booking.fulfilment} />
            <Detail label="Delivery address" value={booking.address ?? "Not added"} />
            <Detail label="Vendor selected time" value={order.actualPickupAt ? date(order.actualPickupAt) : "Not scheduled yet"} />
            <Detail label="Actual pickup" value={date(order.actualPickupAt)} />
            <Detail label="Actual return" value={date(order.actualReturnAt)} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <Panel className="p-6">
          <SectionTitle icon={<CreditCard size={19} />} title="Payment" />
          <div className="mt-5 grid gap-4">
            <Detail label="Payment status" value={label(order.paymentStatus)} />
            <Detail label="Preference" value={booking.paymentPreference ?? "Not specified"} />
            <Detail label="Outstanding balance" value={money(order.paymentSummary?.outstandingBalance ?? order.grandTotal)} />
            {order.payments?.map((payment) => (
              <div key={payment.id} className="rounded-xl bg-surface p-3 text-sm">
                <p className="font-bold text-text">{money(payment.amount)} via {payment.method}</p>
                <p className="mt-1 text-chalk">{label(payment.status)}{payment.transactionId ? ` · UTR ${payment.transactionId}` : ""}</p>
                {payment.paymentProof && <a href={payment.paymentProof} className="mt-2 inline-block text-xs font-bold text-accent">View proof</a>}
              </div>
            ))}
            {canPayOrder(order) && (
              <button disabled={busy} onClick={() => void openQr()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-black disabled:opacity-60">
                <QrCode size={17} /> Pay by UPI
              </button>
            )}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionTitle icon={<Store size={19} />} title="Vendor" />
          <div className="mt-5 grid gap-4">
            <Detail label="Vendor" value={vendorName.toLowerCase() === "string" ? "Rental partner" : vendorName} />
            <Detail label="Email" value={order.vendor?.email ?? "Not available"} />
            <Detail label="Phone" value={order.vendor?.phone ?? "Not available"} />
            <Detail label="UPI ID" value={order.vendor?.upiId ?? "Not configured"} />
          </div>
        </Panel>
      </div>

      {order.rejectionReason && (
        <Panel className="p-6">
          <SectionTitle icon={<UserRound size={19} />} title="Rejection details" />
          <p className="mt-3 text-sm text-chalk">{order.rejectionReason}</p>
        </Panel>
      )}

      {qr && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="mx-auto my-8 max-w-lg rounded-2xl border border-border bg-surface-raised p-5 shadow-2xl">
            <h2 className="font-display text-xl font-bold text-text">UPI payment</h2>
            <div className="mt-4 grid gap-4 rounded-xl bg-surface p-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="rounded-xl bg-white p-3"><img src={getQrCodeUrl(qr.upiLink)} alt="UPI payment QR code" className="h-[220px] w-[220px]" /></div>
              <div>
                <p className="font-bold text-text">{money(qr.amount)} to {qr.vendorName.toLowerCase() === "string" ? "Rental partner" : qr.vendorName}</p>
                <p className="mt-1 text-sm text-chalk">{qr.upiId}</p>
                <a href={qr.upiLink} className="mt-3 inline-flex rounded-lg bg-accent px-3 py-2 text-xs font-bold text-black">Open UPI app</a>
                <button type="button" onClick={() => navigator.clipboard.writeText(qr.upiLink)} className="ml-2 mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold text-text"><Clipboard size={14} />Copy</button>
              </div>
            </div>
            <label className="mt-4 block text-sm font-semibold text-text">UTR / Transaction ID<input value={utr} onChange={(event) => setUtr(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text" /></label>
            <label className="mt-4 block text-sm font-semibold text-text">Payment proof URL<input value={proof} onChange={(event) => setProof(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text" /></label>
            <div className="mt-5 flex gap-2">
              <button disabled={utr.length < 8 || busy} onClick={() => void submitPayment()} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50">Submit payment</button>
              <button onClick={() => setQr(null)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-text">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="flex items-center gap-2 font-display text-lg font-bold text-text"><span className="text-accent">{icon}</span>{title}</div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold uppercase tracking-wide text-chalk">{label}</p><p className="mt-1 text-sm font-semibold text-text">{value}</p></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-surface p-4"><p className="text-xs font-bold uppercase tracking-wide text-chalk">{label}</p><p className="mt-1 font-display text-xl font-bold text-text">{value}</p></div>;
}

function StatusPill({ label, muted = false }: { label: string; muted?: boolean }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${muted ? "bg-black/5 text-chalk dark:bg-white/10" : "bg-accent/15 text-accent"}`}>{label}</span>;
}
