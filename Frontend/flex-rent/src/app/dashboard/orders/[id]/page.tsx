"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Clipboard, ExternalLink, MapPin, QrCode, Store, Truck, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  { key: "PAYMENT_SUBMITTED", label: "Payment Submitted" },
  { key: "PAID", label: "Payment Verified" },
  { key: "PICKED_UP", label: "Picked Up" },
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

const getStepDate = (stepKey: string, order: any) => {
  if (stepKey === "QUOTATION") {
    return order.createdAt || order.rentalStart;
  }
  if (stepKey === "CONFIRMED") {
    return order.approvedAt;
  }
  if (stepKey === "PAYMENT_SUBMITTED") {
    const p = order.payments?.find((pay: any) => ["PAYMENT_SUBMITTED", "PAID"].includes(pay.status));
    return p?.createdAt || null;
  }
  if (stepKey === "PAID") {
    const p = order.payments?.find((pay: any) => ["PAID"].includes(pay.status));
    return p?.verifiedAt || p?.updatedAt || null;
  }
  if (stepKey === "PICKED_UP") {
    return order.actualPickupAt;
  }
  if (stepKey === "RETURNED") {
    return order.actualReturnAt;
  }
  return null;
};

const formatStepDate = (value?: string | Date | null) => {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
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

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    if (error) {
      return (
        <div className="py-12 text-center">
          <p className="text-lg font-medium text-red-500">{error}</p>
          <button onClick={load} className="mt-4 inline-block rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-black hover:bg-accent/90 transition">
            Try again
          </button>
        </div>
      );
    }
    return (
      <div className="py-12 text-center">
        <p className="text-lg font-medium text-text">Order not found.</p>
        <Link href="/dashboard/orders" className="mt-4 inline-block text-accent hover:underline">Return to orders</Link>
      </div>
    );
  }

  const vendorName = order.vendor?.companyName ?? order.vendor?.fullName ?? "Rental partner";
  const currentStepIndex = [...steps].reverse().findIndex(step => 
    order.status === step.key || 
    order.paymentStatus === step.key || 
    timeline.some(event => (event.status === step.key || event.label.toUpperCase().includes(step.label.toUpperCase().split(" ")[0])) && event.completed)
  );
  
  const completedIndex = currentStepIndex !== -1 ? steps.length - 1 - currentStepIndex : -1;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Top Navigation */}
      <nav aria-label="Breadcrumb">
        <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-sm font-medium text-chalk transition-colors hover:text-text">
          <ArrowLeft size={16} /> Back to orders
        </Link>
      </nav>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Header Section */}
      <header className="flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-chalk">Order Date: {date(order.createdAt || order.rentalStart).split(',')[0]}</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">Order #{order.rentalNumber.replace("ORD-", "")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge label={label(order.status)} variant="primary" />
          <StatusBadge label={label(order.paymentStatus)} variant="secondary" />
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-12">
        {/* Order Progress */}
        <section>
          <h2 className="mb-8 font-display text-2xl font-semibold text-text text-center md:text-left">Order Progress</h2>
          <div className="relative flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-4 px-4 md:px-0">
            {/* Connecting Lines - Desktop (horizontal) */}
            <div className="absolute left-[8.33%] right-[8.33%] top-4 hidden h-[2px] -translate-y-1/2 md:flex">
              {Array.from({ length: steps.length - 1 }).map((_, idx) => {
                const done = idx < completedIndex;
                return (
                  <div 
                    key={idx}
                    className={`flex-1 h-full mx-4 transition-all duration-500 ${done ? 'bg-accent shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'border-t-2 border-dashed border-border'}`}
                  />
                );
              })}
            </div>

            {steps.map((step, idx) => {
              const done = idx <= completedIndex;
              const active = idx === completedIndex && idx !== steps.length - 1;
              const stepDate = getStepDate(step.key, order);
              
              return (
                <div key={step.key} className="relative flex items-start gap-4 md:flex-col md:items-center md:gap-3 md:w-full md:flex-1">
                  {/* Vertical Line for mobile */}
                  {idx < steps.length - 1 && (
                    <div 
                      className={`absolute left-[15px] top-8 w-[2px] h-[calc(100%+32px)] md:hidden transition-all duration-500 ${
                        idx < completedIndex 
                          ? 'bg-accent' 
                          : 'border-l-2 border-dashed border-border'
                      }`} 
                    />
                  )}

                  <div className="relative shrink-0">
                    {active && (
                      <div className="absolute inset-0 animate-ping rounded-full bg-accent/60 duration-1000" />
                    )}
                    <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-500 ${done ? 'border-accent bg-accent text-black shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'border-border bg-surface text-chalk'} ${active ? 'ring-4 ring-accent/30' : ''}`}>
                      {done ? <Check size={16} strokeWidth={3} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col text-left md:text-center mt-1 md:mt-0">
                    <span className={`text-sm font-bold uppercase tracking-wider ${done ? 'text-text' : 'text-chalk'} ${active ? 'animate-pulse text-text' : ''}`}>
                      {step.label}
                    </span>
                    {done && stepDate && (
                      <span className="mt-1 text-[11px] text-chalk font-medium whitespace-nowrap">
                        {formatStepDate(stepDate)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ordered Items & Vendor */}
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-text">Items in this order</h2>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface/30">
            <div className="divide-y divide-border/60">
              {order.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
                  <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-surface-raised sm:w-28">
                    <img src={item.product.primaryImage?.url ?? fallbackImage} alt={item.product.primaryImage?.altText ?? item.product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-lg font-bold text-text">{item.product.name}</p>
                        <p className="mt-1 text-sm text-chalk">{item.product.category?.name ?? "Equipment"}</p>
                      </div>
                      <p className="text-right font-display text-lg font-bold text-text">{money(item.subtotal)}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-6 text-sm">
                      <span className="font-medium text-chalk">Qty: <strong className="text-text">{item.quantity}</strong></span>
                      <span className="font-medium text-chalk">Price: <strong className="text-text">{money(item.rentalPrice)}</strong>/day</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Vendor Deal Inside Items */}
            <div className="bg-surface-raised p-5 border-t border-border/60">
              <div className="flex items-center gap-3">
                <Store size={18} className="text-chalk" />
                <div>
                  <p className="text-sm font-semibold text-text">Provided by {vendorName.toLowerCase() === "string" ? "Rental partner" : vendorName}</p>
                  {(order.vendor?.email || order.vendor?.phone) && (
                    <p className="mt-0.5 text-xs text-chalk">
                      Contact: {[order.vendor.email, order.vendor.phone].filter(Boolean).join(" • ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Details */}
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-text">Delivery Details</h2>
          <div className="rounded-2xl border border-border/60 bg-surface/30 p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 w-full">
                <span className="text-sm font-semibold text-chalk shrink-0 min-w-32">Method:</span>
                <span className="text-sm font-medium text-text flex-1 min-w-0 break-words">{booking.fulfilment}</span>
              </div>
              <div className="flex items-start gap-3 w-full">
                <span className="text-sm font-semibold text-chalk shrink-0 min-w-32">Delivery Address:</span>
                <span className="text-sm font-medium text-text flex-1 min-w-0 break-all sm:break-words">{booking.address || "N/A"}</span>
              </div>
              <div className="flex items-start gap-3 w-full">
                <span className="text-sm font-semibold text-chalk shrink-0 min-w-32">Rental Period:</span>
                <span className="text-sm font-medium text-text flex-1 min-w-0 break-words">
                  {date(order.rentalStart).split(',')[0]} to {date(order.rentalEnd).split(',')[0]}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Payments */}
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-text">Payments</h2>
          <div className="rounded-2xl border border-border/60 bg-surface/30 p-6">
            <div className="flex flex-col gap-8 md:flex-row md:justify-between">
              {/* Order Summary */}
              <div className="flex-1 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-chalk">Subtotal</span>
                  <span className="font-medium text-text">{money(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-chalk">Security Deposit</span>
                  <span className="font-medium text-text">{money(order.securityDepositAmount)}</span>
                </div>
                {order.lateFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-chalk">Late Fee</span>
                    <span className="font-medium text-text">{money(order.lateFee)}</span>
                  </div>
                )}
                <div className="h-px w-full bg-border/60" />
                <div className="flex justify-between">
                  <span className="font-semibold text-text">Total</span>
                  <span className="font-display text-lg font-bold text-text">{money(order.grandTotal)}</span>
                </div>
                {(order.paymentSummary?.outstandingBalance ?? 0) > 0 && (
                  <div className="flex justify-between rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-text mt-2">
                    <span className="font-medium">Amount Due</span>
                    <span className="font-bold">{money(order.paymentSummary?.outstandingBalance ?? order.grandTotal)}</span>
                  </div>
                )}
                {canPayOrder(order) && (
                  <button 
                    disabled={busy} 
                    onClick={() => void openQr()} 
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-bold text-black transition hover:bg-accent/90 disabled:opacity-60"
                  >
                    <QrCode size={18} /> Pay Balance via UPI
                  </button>
                )}
              </div>
              
              {/* Payment History */}
              {order.payments && order.payments.length > 0 && (
                <div className="flex-1 space-y-3 md:border-l md:border-border/60 md:pl-8">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-chalk mb-4">Payment History</h3>
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="text-sm bg-surface-raised p-3 rounded-xl border border-border/50">
                      <p className="font-medium text-text">{money(payment.amount)} via {payment.method}</p>
                      <p className="mt-1 flex items-center justify-between text-xs text-chalk">
                        <span>{label(payment.status)}</span>
                        {payment.transactionId && <span className="font-mono">UTR: {payment.transactionId}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>


        {/* Rejection */}
        {order.rejectionReason && (
          <section>
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-red-600 dark:text-red-400">
                <UserRound size={18} /> Cancellation / Rejection
              </h3>
              <p className="mt-2 text-sm text-red-800 dark:text-red-200">{order.rejectionReason}</p>
            </div>
          </section>
        )}
      </div>

      {/* UPI Payment Modal (Unchanged functionality, updated styling) */}
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
                <img src={getQrCodeUrl(qr.upiLink)} alt="UPI QR code" className="h-[200px] w-[200px]" />
              </div>
              <p className="mt-4 font-display text-2xl font-bold text-text">{money(qr.amount)}</p>
              <p className="text-sm font-medium text-chalk">to {qr.vendorName.toLowerCase() === "string" ? "Rental partner" : qr.vendorName}</p>
              <p className="mt-1 text-xs text-chalk/70">{qr.upiId}</p>
              
              <div className="mt-5 flex w-full gap-2">
                <a href={qr.upiLink} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-sm font-bold text-black transition hover:bg-accent/90">
                  <ExternalLink size={16} /> Open App
                </a>
                <button type="button" onClick={() => navigator.clipboard.writeText(qr.upiLink)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm font-bold text-text transition hover:bg-surface">
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
              <button disabled={utr.length < 8 || busy} onClick={() => void submitPayment()} className="mt-2 w-full rounded-xl bg-accent px-4 py-3.5 text-sm font-bold text-black transition hover:bg-accent/90 disabled:opacity-50">
                Verify Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ label, variant }: { label: string; variant: 'primary' | 'secondary' }) {
  if (variant === 'primary') {
    return <span className="inline-flex rounded-full bg-accent/15 px-3 py-1.5 text-xs font-bold text-accent">{label}</span>;
  }
  return <span className="inline-flex rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-chalk border border-border/60">{label}</span>;
}