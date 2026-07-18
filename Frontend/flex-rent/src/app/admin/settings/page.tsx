"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  DEFAULT_ORG_SETTINGS,
  SETTINGS_STORAGE_KEY,
} from "@/features/admin/data/mockSettings";
import type { OrgRentalSettings } from "@/features/admin/types";

const schema = z.object({
  orgName: z.string().min(2, "Organization name required"),
  lateFeePercent: z.number().min(0).max(100),
  flatLateFee: z.number().min(0),
  defaultDeposit: z.number().min(0),
  pickupWindowHours: z.number().min(1).max(48),
  returnGraceHours: z.number().min(0).max(72),
});

type FormValues = z.infer<typeof schema>;

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_ORG_SETTINGS,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as OrgRentalSettings;
        reset({ ...DEFAULT_ORG_SETTINGS, ...parsed });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setLoaded(true);
  }, [reset]);

  const onSubmit = (data: FormValues) => {
    const settings: OrgRentalSettings = { ...data };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!loaded) {
    return (
      <div>
        <PageHeader
          title="Rental Settings"
          description="Configure organization-specific rental settings."
        />
        <p className="text-sm text-chalk">Loading settings…</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Rental Configuration"
        description="Late fees, deposits, pickup and return windows for your organization."
      />

      <Panel className="p-5">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid max-w-2xl gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <Input
              id="orgName"
              label="Organization name"
              error={errors.orgName?.message}
              {...register("orgName")}
            />
          </div>
          <Input
            id="lateFeePercent"
            type="number"
            step="0.5"
            label="Late fee (%)"
            error={errors.lateFeePercent?.message}
            {...register("lateFeePercent", { valueAsNumber: true })}
          />
          <Input
            id="flatLateFee"
            type="number"
            label="Flat late fee (₹)"
            error={errors.flatLateFee?.message}
            {...register("flatLateFee", { valueAsNumber: true })}
          />
          <Input
            id="defaultDeposit"
            type="number"
            label="Default deposit (₹)"
            error={errors.defaultDeposit?.message}
            {...register("defaultDeposit", { valueAsNumber: true })}
          />
          <Input
            id="pickupWindowHours"
            type="number"
            label="Pickup window (hours)"
            error={errors.pickupWindowHours?.message}
            {...register("pickupWindowHours", { valueAsNumber: true })}
          />
          <Input
            id="returnGraceHours"
            type="number"
            label="Return grace (hours)"
            error={errors.returnGraceHours?.message}
            {...register("returnGraceHours", { valueAsNumber: true })}
          />
          <div className="flex items-center gap-4 sm:col-span-2">
            <div className="w-full sm:w-48">
              <Button type="submit">Save settings</Button>
            </div>
            {saved && (
              <p className="text-sm text-green-300">Saved to this browser.</p>
            )}
          </div>
        </form>
      </Panel>
    </div>
  );
}
