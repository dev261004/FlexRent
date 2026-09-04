"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Calendar, Clock, AlertCircle, CheckCircle2, X, Store } from "lucide-react";
import { createBooking, previewBooking, type RentalOrder } from "@/features/customer/api";

interface RentAgainModalProps {
  order: RentalOrder;
  isOpen: boolean;
  onClose: () => void;
}

const money = (val?: string | number | null) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(val ?? 0));

export function RentAgainModal({ order, isOpen, onClose }: RentAgainModalProps) {
  const router = useRouter();

  // Default new dates starting tomorrow for the same duration
  const originalDurationMs = new Date(order.rentalEnd).getTime() - new Date(order.rentalStart).getTime();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const defaultEnd = new Date(tomorrow.getTime() + Math.max(originalDurationMs, 24 * 60 * 60 * 1000));

  const [startDate, setStartDate] = useState<string>(tomorrow.toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState<string>("10:00");
  const [endDate, setEndDate] = useState<string>(defaultEnd.toISOString().split("T")[0]);
  const [endTime, setEndTime] = useState<string>("18:00");
  const [notes, setNotes] = useState<string>("");

  const [preview, setPreview] = useState<{
    subtotal: string;
    securityDepositAmount: string;
    grandTotal: string;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const minStartDate = new Date().toISOString().split("T")[0];
  const primaryItem = order.items?.[0];
  const vendorId = order.vendorId ?? (order.vendor as any)?.id;

  // Live preview calculation when dates change
  useEffect(() => {
    if (!isOpen || !startDate || !endDate || !primaryItem || !vendorId) return;

    const startIso = new Date(`${startDate}T${startTime || "10:00"}:00.000Z`).toISOString();
    const endIso = new Date(`${endDate}T${endTime || "18:00"}:00.000Z`).toISOString();

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setError("End date must be after the start date.");
      setPreview(null);
      return;
    }

    let active = true;
    setLoadingPreview(true);
    setError("");

    previewBooking({
      vendorId,
      rentalStart: startIso,
      rentalEnd: endIso,
      items: [{ productId: primaryItem.product ? (primaryItem as any).productId || (primaryItem.product as any).id : "", quantity: primaryItem.quantity }],
    })
      .then((res) => {
        if (active) {
          setPreview(res);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setPreview(null);
          setError(err?.response?.data?.message || "Could not calculate rates for selected dates.");
        }
      })
      .finally(() => {
        if (active) setLoadingPreview(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, startDate, startTime, endDate, endTime, primaryItem, vendorId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryItem || !vendorId || !order.customerId) return;

    const startIso = new Date(`${startDate}T${startTime || "10:00"}:00.000Z`).toISOString();
    const endIso = new Date(`${endDate}T${endTime || "18:00"}:00.000Z`).toISOString();

    setSubmitting(true);
    setError("");

    try {
      const newOrder = await createBooking({
        customerId: order.customerId,
        vendorId,
        productId: (primaryItem as any).productId || (primaryItem.product as any).id,
        quantity: primaryItem.quantity,
        rentalStart: startIso,
        rentalEnd: endIso,
        notes: notes ? `Rent Again: ${notes}` : "Re-booked using Rent Again facility",
        fulfillmentMethod: order.fulfillmentMethod,
        deliveryAddress: order.deliveryAddress,
        pickupAddress: order.pickupLocation,
      });

      onClose();
      router.push(`/dashboard/orders/${newOrder.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create new rental order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface-raised p-6 shadow-2xl md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <RotateCcw size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-text">Rent Again</h2>
              <p className="text-xs text-chalk">Quickly re-book the equipment from this order</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-chalk hover:bg-surface hover:text-text">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Selected Product Summary */}
          <div className="rounded-xl border border-border/60 bg-surface/50 p-4 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-chalk">Equipment</span>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-text">{primaryItem?.product?.name ?? "Equipment item"}</p>
                <p className="text-xs text-chalk">Qty: {primaryItem?.quantity ?? 1}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-accent flex items-center gap-1">
                  <Store size={13} /> {order.vendor?.companyName || order.vendor?.fullName || "Rental Partner"}
                </span>
              </div>
            </div>
          </div>

          {/* New Rental Start Date & Time */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chalk">New Start Date *</label>
              <input
                type="date"
                min={minStartDate}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chalk">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-accent"
              />
            </div>
          </div>

          {/* New Rental End Date & Time */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chalk">New End Date *</label>
              <input
                type="date"
                min={startDate || minStartDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chalk">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-accent"
              />
            </div>
          </div>

          {/* Live Quote Preview */}
          {loadingPreview && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-surface/30 p-4 text-xs text-chalk animate-pulse">
              <Clock size={15} className="animate-spin text-accent" /> Calculating quotation...
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {preview && !loadingPreview && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-chalk">
                <span>Rental Subtotal:</span>
                <span className="font-semibold text-text">{money(preview.subtotal)}</span>
              </div>
              <div className="flex justify-between text-chalk">
                <span>Security Deposit:</span>
                <span className="font-semibold text-text">{money(preview.securityDepositAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-2 text-sm font-bold text-text">
                <span>Total Quotation:</span>
                <span className="font-display text-accent">{money(preview.grandTotal)}</span>
              </div>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chalk">Notes for Vendor (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific delivery instructions or preferences..."
              className="mt-1.5 w-full rounded-xl border border-border bg-surface p-3 text-xs text-text outline-none transition focus:border-accent resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-chalk transition hover:bg-surface hover:text-text disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !preview || loadingPreview}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-black transition hover:bg-accent/90 disabled:opacity-50"
            >
              {submitting ? "Creating Order..." : "Confirm & Book Again"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
