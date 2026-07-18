"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MOCK_RENTAL_PERIODS } from "@/features/admin/data/mockPeriods";
import type { AdminRentalPeriod } from "@/features/admin/types";

const schema = z
  .object({
    name: z.string().min(2, "Name is required"),
    minDays: z.number().min(1, "Min days required"),
    maxDays: z.number().min(1, "Max days required"),
    multiplier: z.number().min(0.1).max(2),
  })
  .refine((d) => d.maxDays >= d.minDays, {
    message: "Max days must be ≥ min days",
    path: ["maxDays"],
  });

type FormValues = z.infer<typeof schema>;

export default function AdminRentalPeriodsPage() {
  const [periods, setPeriods] =
    useState<AdminRentalPeriod[]>(MOCK_RENTAL_PERIODS);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      minDays: 1,
      maxDays: 7,
      multiplier: 1,
    },
  });

  const onSubmit = (data: FormValues) => {
    const next: AdminRentalPeriod = {
      id: `rp${Date.now()}`,
      name: data.name,
      minDays: data.minDays,
      maxDays: data.maxDays,
      multiplier: data.multiplier,
    };
    setPeriods((prev) => [next, ...prev]);
    reset();
    setShowForm(false);
  };

  return (
    <div>
      <PageHeader
        title="Rental Periods"
        description="Define rental period windows and rate multipliers."
        action={
          <div className="w-full sm:w-44">
            <Button type="button" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancel" : "+ Create Period"}
            </Button>
          </div>
        }
      />

      {showForm && (
        <Panel className="mb-6 p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-text">
            New rental period
          </h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Input
              id="period-name"
              label="Period name"
              placeholder="Weekend"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              id="multiplier"
              type="number"
              step="0.05"
              label="Rate multiplier"
              error={errors.multiplier?.message}
              {...register("multiplier", { valueAsNumber: true })}
            />
            <Input
              id="minDays"
              type="number"
              label="Min days"
              error={errors.minDays?.message}
              {...register("minDays", { valueAsNumber: true })}
            />
            <Input
              id="maxDays"
              type="number"
              label="Max days"
              error={errors.maxDays?.message}
              {...register("maxDays", { valueAsNumber: true })}
            />
            <div className="sm:col-span-2">
              <div className="w-full sm:w-48">
                <Button type="submit">Save period</Button>
              </div>
            </div>
          </form>
        </Panel>
      )}

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-chalk">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Min days</th>
                <th className="px-5 py-3 font-medium">Max days</th>
                <th className="px-5 py-3 font-medium">Multiplier</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((rp) => (
                <tr key={rp.id} className="border-t border-white/5">
                  <td className="px-5 py-3 font-medium text-text">{rp.name}</td>
                  <td className="px-5 py-3 text-text">{rp.minDays}</td>
                  <td className="px-5 py-3 text-text">{rp.maxDays}</td>
                  <td className="px-5 py-3 text-accent">{rp.multiplier}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
