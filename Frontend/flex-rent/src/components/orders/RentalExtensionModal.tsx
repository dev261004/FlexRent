"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight, X, Sparkles, ShieldCheck } from "lucide-react";
import {
  previewRentalOrderExtension,
  requestRentalOrderExtension,
  type RentalOrder,
  type ExtensionPreviewResult,
} from "@/features/customer/api";

interface RentalExtensionModalProps {
  order: RentalOrder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: RentalOrder) => void;
}

const money = (val?: string | number | null) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(val ?? 0));

export function RentalExtensionModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: RentalExtensionModalProps) {
  const currentEnd = new Date(order.rentalEnd);
  
  // Default to +3 days from current end
  const defaultNextDate = new Date(currentEnd.getTime() + 3 * 24 * 60 * 60 * 1000);
  const minDateString = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(
    defaultNextDate.toISOString().split("T")[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>("18:00");
  const [reason, setReason] = useState<string>("");
  const [preview, setPreview] = useState<ExtensionPreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const presets = [
    { label: "+3 Days", days: 3 },
    { label: "+7 Days", days: 7 },
    { label: "+14 Days", days: 14 },
    { label: "+30 Days", days: 30 },
  ];

  const applyPreset = (days: number) => {
    const next = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
    setSelectedDate(next.toISOString().split("T")[0]);
  };

  // Compute preview when date or time changes
  useEffect(() => {
    if (!isOpen || !selectedDate) return;

    const targetIso = new Date(`${selectedDate}T${selectedTime || "18:00"}:00.000Z`).toISOString();
    if (new Date(targetIso).getTime() <= currentEnd.getTime()) {
      setError("Extension date must be after the current return date.");
      setPreview(null);
      return;
    }

    let active = true;
    setLoadingPreview(true);
    setError("");

    previewRentalOrderExtension(order.id, targetIso)
      .then((res) => {
        if (active) {
          setPreview(res);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setPreview(null);
          setError(err?.response?.data?.message || "Selected dates are not available for extension.");
        }
      })
      .finally(() => {
        if (active) setLoadingPreview(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, selectedDate, selectedTime, order.id, currentEnd.getTime()]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    const targetIso = new Date(`${selectedDate}T${selectedTime || "18:00"}:00.000Z`).toISOString();
    setSubmitting(true);
    setError("");

    try {
      const updated = await requestRentalOrderExtension(order.id, {
        newRentalEnd: targetIso,
        reason: reason.trim() || undefined,
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to submit extension request.");
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
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-text">Extend Rental Duration</h2>
              <p className="text-xs text-chalk">Order #{order.rentalNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-chalk hover:bg-surface hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Current Return Date Info */}
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface/50 p-3.5 text-xs text-chalk">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock size={14} className="text-chalk/80" /> Current Return Date:
            </span>
            <span className="font-semibold text-text">
              {currentEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at {currentEnd.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Quick Preset Chips */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chalk">
              Quick Extension Options
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.days)}
                  className="rounded-lg border border-border/70 bg-surface px-3 py-1.5 text-xs font-semibold text-text transition hover:border-accent hover:text-accent focus:outline-none"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chalk">
                New Return Date *
              </label>
              <div className="mt-1.5 relative">
                <input
                  type="date"
                  min={minDateString}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chalk">
                Time
              </label>
              <div className="mt-1.5 relative">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Live Price Preview Card */}
          {loadingPreview && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-surface/30 p-5 text-xs text-chalk animate-pulse">
              <Clock size={16} className="animate-spin text-accent" /> Calculating rates and checking equipment availability...
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {preview && !loadingPreview && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-accent">
                  <CheckCircle2 size={14} /> Available for Extension
                </span>
                <span className="text-xs font-semibold text-text">
                  +{preview.additionalDays} Days Added
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-chalk">
                  <span>Additional Rental Fee:</span>
                  <span className="font-semibold text-text">{money(preview.additionalRentalFee)}</span>
                </div>
                {Number(preview.additionalDeposit) > 0 && (
                  <div className="flex justify-between text-chalk">
                    <span>Additional Security Deposit:</span>
                    <span className="font-semibold text-text">{money(preview.additionalDeposit)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border/40 pt-2 text-sm font-bold text-text">
                  <span>Total Extension Amount:</span>
                  <span className="font-display text-accent">{money(preview.additionalGrandTotal)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-chalk pt-1">
                <ShieldCheck size={13} className="text-accent shrink-0" />
                <span>Vendor will review this request. You will only be billed once approved.</span>
              </div>
            </div>
          )}

          {/* Optional Reason / Notes */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chalk">
              Reason / Message for Vendor (Optional)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Project timeline extended, need the tools for 3 more days."
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
              {submitting ? "Submitting Request..." : "Request Extension"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
