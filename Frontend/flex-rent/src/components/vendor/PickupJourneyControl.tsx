"use client";

import React, { useState } from "react";
import { Navigation, Clock, CheckCircle2, MapPin, Calendar, AlertCircle } from "lucide-react";
import { RentalOrder, schedulePickup, startPickupJourney, markVendorArrived, updatePickupEta, completePickupVendor } from "@/features/customer/api";
import { PickupSchedulerModal } from "./PickupSchedulerModal";

interface PickupJourneyControlProps {
  order: RentalOrder;
  onUpdate: (updatedOrder: RentalOrder) => void;
}

export function PickupJourneyControl({ order, onUpdate }: PickupJourneyControlProps) {
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isEtaOpen, setIsEtaOpen] = useState(false);
  const [etaInput, setEtaInput] = useState<number>(order.pickupETAInMinutes || 15);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSchedule = async (data: { pickupScheduledAt: string; pickupETAInMinutes?: number; notes?: string }) => {
    const updated = await schedulePickup(order.id, data);
    onUpdate(updated);
  };

  const handleStartJourney = async () => {
    try {
      setError(null);
      setLoadingAction("start");
      const updated = await startPickupJourney(order.id);
      onUpdate(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to start pickup journey");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMarkArrived = async () => {
    try {
      setError(null);
      setLoadingAction("arrive");
      const updated = await markVendorArrived(order.id);
      onUpdate(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to mark arrival");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpdateEtaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setLoadingAction("eta");
      const updated = await updatePickupEta(order.id, etaInput);
      onUpdate(updated);
      setIsEtaOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update ETA");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCompleteHandover = async () => {
    try {
      setError(null);
      setLoadingAction("complete");
      const updated = await completePickupVendor(order.id);
      onUpdate(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to complete handover");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5 shadow-xl backdrop-blur-xl text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Navigation className="h-4 w-4 text-indigo-400" /> Pickup Operations Control
          </h3>
          <p className="text-xs text-slate-400">Manage journey stages and inform customer</p>
        </div>

        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-mono text-indigo-300 border border-indigo-500/20">
          Status: {order.status}
        </span>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Action Buttons grid */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Stage 1: Schedule Pickup (if CONFIRMED) */}
        {order.status === "CONFIRMED" && (
          <button
            onClick={() => setIsSchedulerOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all active:scale-95"
          >
            <Calendar className="h-4 w-4" /> Schedule Pickup
          </button>
        )}

        {/* Stage 2: Start Journey (if PICKUP_SCHEDULED) */}
        {order.status === "PICKUP_SCHEDULED" && (
          <button
            onClick={handleStartJourney}
            disabled={loadingAction === "start"}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95 disabled:opacity-50"
          >
            <Navigation className="h-4 w-4" /> {loadingAction === "start" ? "Starting..." : "Start Journey"}
          </button>
        )}

        {/* Stage 3: Mark Arrived (if PICKUP_IN_PROGRESS and not arrived) */}
        {order.status === "PICKUP_IN_PROGRESS" && !order.pickupArrivedAt && (
          <button
            onClick={handleMarkArrived}
            disabled={loadingAction === "arrive"}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:from-amber-500 hover:to-orange-500 transition-all active:scale-95 disabled:opacity-50"
          >
            <MapPin className="h-4 w-4" /> {loadingAction === "arrive" ? "Updating..." : "Mark Arrived"}
          </button>
        )}

        {/* Stage 4: Update ETA (if PICKUP_SCHEDULED or PICKUP_IN_PROGRESS) */}
        {(order.status === "PICKUP_SCHEDULED" || order.status === "PICKUP_IN_PROGRESS") && (
          <button
            onClick={() => setIsEtaOpen(!isEtaOpen)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            <Clock className="h-4 w-4 text-emerald-400" /> Update ETA
          </button>
        )}

        {/* Stage 5: Handover complete / Waiting Customer Confirmation */}
        {order.status === "PICKUP_IN_PROGRESS" && order.pickupArrivedAt && !order.pickupConfirmedByCustomer && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleCompleteHandover}
              disabled={loadingAction === "complete"}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Handover Complete
            </button>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 animate-pulse">
              Awaiting Customer Confirmation
            </span>
          </div>
        )}

        {/* Active Stage Indicator */}
        {order.status === "ACTIVE" && (
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/30">
            <CheckCircle2 className="h-5 w-5" /> Customer Confirmed - Rental Active
          </div>
        )}
      </div>

      {/* Inline ETA Update Form */}
      {isEtaOpen && (
        <form onSubmit={handleUpdateEtaSubmit} className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4 animate-in slide-in-from-top-2 duration-150">
          <input
            type="number"
            min="1"
            max="300"
            value={etaInput}
            onChange={(e) => setEtaInput(Number(e.target.value))}
            className="w-32 rounded-xl border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            placeholder="Minutes"
          />
          <button
            type="submit"
            disabled={loadingAction === "eta"}
            className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
          >
            Save ETA
          </button>
          <button
            type="button"
            onClick={() => setIsEtaOpen(false)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Scheduler Modal */}
      <PickupSchedulerModal
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        onSchedule={handleSchedule}
        initialDate={order.rentalStart}
      />
    </div>
  );
}
