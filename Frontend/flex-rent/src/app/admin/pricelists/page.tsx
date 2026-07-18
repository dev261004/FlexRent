"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Combobox } from "@/components/ui/Combobox";
import { MOCK_PRICELISTS } from "@/features/admin/data/mockPricelists";
import { MOCK_PRODUCTS } from "@/features/admin/data/mockProducts";
import type { AdminPricelist } from "@/features/admin/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  productId: z.string().min(1, "Product is required"),
  dailyRate: z.number().min(0),
  weeklyRate: z.number().min(0),
  monthlyRate: z.number().min(0),
});

type FormValues = z.infer<typeof schema>;

const productOptions = MOCK_PRODUCTS.map((p) => ({
  value: p.id,
  label: p.name,
}));

export default function AdminPricelistsPage() {
  const [pricelists, setPricelists] =
    useState<AdminPricelist[]>(MOCK_PRICELISTS);
  const [showForm, setShowForm] = useState(false);

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
      productId: "",
      dailyRate: 0,
      weeklyRate: 0,
      monthlyRate: 0,
    },
  });

  const productId = watch("productId");

  const onSubmit = (data: FormValues) => {
    const product = MOCK_PRODUCTS.find((p) => p.id === data.productId);
    const next: AdminPricelist = {
      id: `pl${Date.now()}`,
      name: data.name,
      productId: data.productId,
      productName: product?.name ?? "Unknown",
      dailyRate: data.dailyRate,
      weeklyRate: data.weeklyRate,
      monthlyRate: data.monthlyRate,
    };
    setPricelists((prev) => [next, ...prev]);
    reset();
    setShowForm(false);
  };

  return (
    <div>
      <PageHeader
        title="Pricelists"
        description="Create and maintain product pricelists (daily, weekly, monthly)."
        action={
          <div className="w-full sm:w-44">
            <Button type="button" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancel" : "+ Create Pricelist"}
            </Button>
          </div>
        }
      />

      {showForm && (
        <Panel className="mb-6 p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-text">
            New pricelist
          </h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Input
              id="pl-name"
              label="Pricelist name"
              placeholder="Camera Standard"
              error={errors.name?.message}
              {...register("name")}
            />
            <Combobox
              label="Product"
              options={productOptions}
              value={productId}
              onChange={(v) =>
                setValue("productId", v, { shouldValidate: true })
              }
              placeholder="Link product"
              error={errors.productId?.message}
            />
            <Input
              id="daily"
              type="number"
              label="Daily rate (₹)"
              error={errors.dailyRate?.message}
              {...register("dailyRate", { valueAsNumber: true })}
            />
            <Input
              id="weekly"
              type="number"
              label="Weekly rate (₹)"
              error={errors.weeklyRate?.message}
              {...register("weeklyRate", { valueAsNumber: true })}
            />
            <Input
              id="monthly"
              type="number"
              label="Monthly rate (₹)"
              error={errors.monthlyRate?.message}
              {...register("monthlyRate", { valueAsNumber: true })}
            />
            <div className="flex items-end">
              <div className="w-full sm:w-48">
                <Button type="submit">Save pricelist</Button>
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
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Daily</th>
                <th className="px-5 py-3 font-medium">Weekly</th>
                <th className="px-5 py-3 font-medium">Monthly</th>
              </tr>
            </thead>
            <tbody>
              {pricelists.map((pl) => (
                <tr key={pl.id} className="border-t border-white/5">
                  <td className="px-5 py-3 font-medium text-text">{pl.name}</td>
                  <td className="px-5 py-3 text-chalk">{pl.productName}</td>
                  <td className="px-5 py-3 text-text">
                    ₹{pl.dailyRate.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-text">
                    ₹{pl.weeklyRate.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-text">
                    ₹{pl.monthlyRate.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
