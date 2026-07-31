"use client";

import React, { useState } from "react";
import { Calendar, Clock, Navigation, FileText, X } from "lucide-react";

interface PickupSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (data: { pickupScheduledAt: string; pickupETAInMinutes?: number; notes?: string }) => Promise<void>;
  initialDate?: string;
}

export function PickupSchedulerModal({
  isOpen,
  onClose,
  onSchedule,
  initialDate,
}: PickupSchedulerModalProps) {
  const defaultDateStr = initialDate ? new Date(initialDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const defaultTimeStr = initialDate ? new Date(initialDate).toTimeString().slice(0, 5) : "14:00";

  const [date, setDate] = useState(defaultDateStr);
  const [time, setTime] = useState(defaultTimeStr);
  const [etaMinutes, setEtaMinutes] = useState<number>(30);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const scheduledDateTime = new Date(`${date}T${time}:00`);
      if (isNaN(scheduledDateTime.getTime())) {
        throw new Error("Invalid pickup date or time");
      }

      await onSchedule({
        pickupScheduledAt: scheduledDateTime.toISOString(),
        pickupETAInMinutes: etaMinutes,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to schedule pickup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-wide">Schedule Pickup</h3>
              <p className="text-xs text-slate-400">Set estimated arrival time & instructions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Date and Time Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" /> Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-purple-400" /> Time
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Quick ETA Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5 text-emerald-400" /> Initial ETA (Minutes)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setEtaMinutes(mins)}
                  className={`rounded-xl py-2 text-xs font-semibold transition-all border ${
                    etaMinutes === mins
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm"
                      : "border-white/10 bg-slate-800/50 text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              max="1440"
              value={etaMinutes}
              onChange={(e) => setEtaMinutes(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              placeholder="Custom ETA in minutes"
            />
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-amber-400" /> Pickup Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add contact info, landmarks, or handover instructions..."
              className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Scheduling..." : "Confirm Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
