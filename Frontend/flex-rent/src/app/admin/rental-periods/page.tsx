"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  CalendarRange,
  Clock,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Combobox } from "@/components/ui/Combobox";
import {
  getRentalPeriods,
  createRentalPeriod,
  deleteRentalPeriod,
} from "@/features/admin/api";
import type { AdminRentalPeriod } from "@/features/admin/types";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  unit: z.enum(["HOUR", "DAY", "NIGHT", "WEEK", "MONTH"]),
  duration: z.coerce.number().int().min(1, "Duration must be at least 1"),
  isDefault: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

const unitOptions = [
  { value: "DAY", label: "Day(s)" },
  { value: "WEEK", label: "Week(s)" },
  { value: "MONTH", label: "Month(s)" },
  { value: "HOUR", label: "Hour(s)" },
  { value: "NIGHT", label: "Night(s)" },
];

export default function AdminRentalPeriodsPage() {
  const [periods, setPeriods] = useState<AdminRentalPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      unit: "DAY",
      duration: 1,
      isDefault: false,
    },
  });

  const unitValue = watch("unit");

  const fetchPeriods = async () => {
    try {
      setIsLoading(true);
      const data = await getRentalPeriods(true);
      if (Array.isArray(data)) {
        setPeriods(data);
      }
    } catch {
      toast.error("Failed to load rental periods");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      const created = await createRentalPeriod({
        name: data.name,
        unit: data.unit,
        duration: data.duration,
        isDefault: data.isDefault,
        isActive: true,
      });

      toast.success(`Rental period "${created.name}" created!`);
      setPeriods((prev) => {
        const next = data.isDefault
          ? prev.map((p) => ({ ...p, isDefault: false }))
          : [...prev];
        return [created, ...next];
      });

      reset();
      setShowForm(false);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create rental period";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (period: AdminRentalPeriod) => {
    if (
      !window.confirm(
        `Are you sure you want to delete rental period "${period.name}"?`
      )
    ) {
      return;
    }

    try {
      setDeletingId(period.id);
      await deleteRentalPeriod(period.id);
      toast.success(`Deleted period "${period.name}"`);
      setPeriods((prev) => prev.filter((p) => p.id !== period.id));
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete rental period";
      toast.error(errorMsg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Rental Periods"
        description="Configure standardized rental duration windows (daily, weekly, monthly) for catalog pricing."
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchPeriods}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-chalk hover:text-text hover:bg-white/5 transition"
              title="Refresh periods"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-accent" : ""} />
              <span>Refresh</span>
            </button>
            <div className="w-full sm:w-44">
              <Button type="button" onClick={() => setShowForm((v) => !v)}>
                {showForm ? "Cancel" : "+ Create Period"}
              </Button>
            </div>
          </div>
        }
      />

      {/* Create Form */}
      {showForm && (
        <Panel className="mb-6 p-6 border-accent/30 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <CalendarRange size={18} className="text-accent" />
              <h2 className="font-display text-lg font-semibold text-text">
                New Rental Period Window
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-chalk hover:text-text"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                id="period-name"
                label="Period Name"
                placeholder="e.g. Standard Weekend, Full Week Pass"
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                id="duration"
                type="number"
                min={1}
                label="Duration Count"
                error={errors.duration?.message}
                {...register("duration")}
              />

              <Combobox
                label="Duration Unit"
                options={unitOptions}
                value={unitValue}
                onChange={(v) =>
                  setValue(
                    "unit",
                    v as "HOUR" | "DAY" | "NIGHT" | "WEEK" | "MONTH",
                    { shouldValidate: true }
                  )
                }
                error={errors.unit?.message}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="period-default"
                type="checkbox"
                className="rounded border-border bg-surface text-accent focus:ring-accent"
                {...register("isDefault")}
              />
              <label
                htmlFor="period-default"
                className="text-xs font-medium text-text cursor-pointer"
              >
                Set as Default Rental Period for New Products
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="w-48">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Save Rental Period"}
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {/* Table Panel */}
      <Panel>
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-text">Configured Periods</h2>
            <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-chalk">
              {periods.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-black/[0.02] text-left text-xs uppercase tracking-wider text-chalk dark:bg-white/[0.02]">
                <th className="px-5 py-3.5 font-semibold sm:px-6">Period Name</th>
                <th className="px-5 py-3.5 font-semibold">Duration & Unit</th>
                <th className="px-5 py-3.5 font-semibold text-center">Default Flag</th>
                <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && periods.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-chalk">
                    <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-accent" />
                    Loading rental periods...
                  </td>
                </tr>
              ) : periods.length > 0 ? (
                periods.map((period) => (
                  <tr
                    key={period.id}
                    className="transition hover:bg-accent/[0.035]"
                  >
                    <td className="px-5 py-4 font-medium text-text sm:px-6">
                      <div className="flex items-center gap-2">
                        <span>{period.name}</span>
                        {period.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-400 border border-amber-500/20">
                            <Star size={10} className="fill-amber-400" /> Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-chalk">
                      <span className="rounded-lg bg-surface px-2.5 py-1 border border-border text-text font-medium">
                        {period.duration} {period.unit.toLowerCase()}(s)
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-xs">
                      {period.isDefault ? (
                        <span className="text-accent font-semibold">Yes</span>
                      ) : (
                        <span className="text-chalk">No</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          period.isActive !== false
                            ? "bg-green-500/15 text-green-700 dark:text-green-300"
                            : "bg-black/5 text-chalk dark:bg-white/10"
                        }`}
                      >
                        {period.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right sm:px-6">
                      <button
                        type="button"
                        onClick={() => handleDelete(period)}
                        disabled={deletingId === period.id}
                        className="rounded-lg p-2 text-chalk hover:bg-danger/10 hover:text-danger transition"
                        title="Delete period"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-chalk">
                    No rental periods configured yet. Click "+ Create Period" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
