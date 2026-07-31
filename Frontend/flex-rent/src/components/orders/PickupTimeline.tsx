"use client";

import React from "react";
import { CheckCircle2, Clock, MapPin, Truck, ShieldCheck, PlayCircle, ChevronRight, FileText } from "lucide-react";
import { PickupTimeline as PickupTimelineType } from "@/features/customer/api";

interface PickupTimelineProps {
  timeline: PickupTimelineType;
  onRefresh?: () => void;
}

export function PickupTimeline({ timeline }: PickupTimelineProps) {
  const getIcon = (id: string, completed: boolean) => {
    switch (id) {
      case "QUOTATION_CREATED":
        return <FileText className={`h-4 w-4 ${completed ? "text-emerald-400" : "text-slate-500"}`} />;
      case "VENDOR_ACCEPTED":
        return <CheckCircle2 className={`h-4 w-4 ${completed ? "text-emerald-400" : "text-slate-500"}`} />;
      case "PICKUP_SCHEDULED":
        return <Clock className={`h-4 w-4 ${completed ? "text-indigo-400" : "text-slate-500"}`} />;
      case "VENDOR_STARTED_JOURNEY":
        return <Truck className={`h-4 w-4 ${completed ? "text-purple-400" : "text-slate-500"}`} />;
      case "VENDOR_ARRIVED":
        return <MapPin className={`h-4 w-4 ${completed ? "text-amber-400" : "text-slate-500"}`} />;
      case "CUSTOMER_CONFIRMED_PICKUP":
        return <ShieldCheck className={`h-4 w-4 ${completed ? "text-teal-400" : "text-slate-500"}`} />;
      case "RENTAL_STARTED":
        return <PlayCircle className={`h-4 w-4 ${completed ? "text-emerald-400" : "text-slate-500"}`} />;
      default:
        return <ChevronRight className="h-4 w-4 text-slate-500" />;
    }
  };

  const formatTimestamp = (iso: string | null) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-xl backdrop-blur-xl text-white">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Live Pickup Lifecycle
          </span>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-white">Pickup Timeline</h2>
          <p className="text-xs text-slate-400">Track handover progress in real time</p>
        </div>

        {/* ETA Badge */}
        {timeline.pickupETAInMinutes !== null && timeline.status !== "ACTIVE" && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 shadow-inner">
            <Clock className="h-5 w-5 text-emerald-400 animate-pulse" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Estimated Arrival</p>
              <p className="text-lg font-extrabold text-white">{timeline.pickupETAInMinutes} mins</p>
            </div>
          </div>
        )}
      </div>

      {/* Stepper Timeline */}
      <div className="relative mt-8 px-2">
        <div className="space-y-6">
          {timeline.stages.map((stage, idx) => {
            const isCurrent = timeline.currentStage === stage.id;
            const isCompleted = stage.completed;
            const isLast = idx === timeline.stages.length - 1;

            return (
              <div key={stage.id} className="relative flex items-start gap-4 group">
                {/* Connecting Vertical Line */}
                {!isLast && (
                  <div
                    className={`absolute left-5 top-8 -bottom-6 w-0.5 transition-colors ${
                      isCompleted ? "bg-emerald-500/50" : "bg-slate-800"
                    }`}
                  />
                )}

                {/* Node Icon Circle */}
                <div
                  className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all ${
                    isCurrent
                      ? "border-indigo-400 bg-indigo-600/30 shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/20"
                      : isCompleted
                      ? "border-emerald-500/40 bg-emerald-500/10 shadow-sm"
                      : "border-slate-800 bg-slate-900"
                  }`}
                >
                  {getIcon(stage.id, isCompleted)}
                </div>

                {/* Stage Info */}
                <div className="flex flex-1 flex-col pt-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4
                      className={`text-sm font-semibold transition-colors ${
                        isCurrent
                          ? "text-indigo-300 font-bold"
                          : isCompleted
                          ? "text-white"
                          : "text-slate-500"
                      }`}
                    >
                      {stage.label}
                    </h4>
                    {isCurrent && (
                      <span className="mt-0.5 inline-block text-[11px] font-medium text-indigo-400 animate-pulse">
                        Current Status
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  {stage.timestamp && (
                    <span className="mt-1 sm:mt-0 text-xs font-mono text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-md border border-white/5">
                      {formatTimestamp(stage.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes Section if present */}
      {timeline.pickupNotes && (
        <div className="mt-8 rounded-xl border border-white/10 bg-slate-800/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-amber-400" /> Vendor Notes
          </p>
          <p className="text-sm text-slate-300 italic">{timeline.pickupNotes}</p>
        </div>
      )}
    </div>
  );
}
