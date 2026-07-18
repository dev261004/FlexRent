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
import { PRODUCT_CATEGORIES } from "@/features/auth/data/productCategories";
import { MOCK_PRODUCTS } from "@/features/admin/data/mockProducts";
import type { AdminProduct, ProductStatus } from "@/features/admin/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  category: z.string().min(1, "Category is required"),
  stock: z.number().min(0, "Stock must be 0 or more"),
  deposit: z.number().min(0, "Deposit must be 0 or more"),
  status: z.enum(["available", "rented", "maintenance"]),
});

type FormValues = z.infer<typeof schema>;

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "rented", label: "Rented" },
  { value: "maintenance", label: "Maintenance" },
];

const categoryOptions = PRODUCT_CATEGORIES.map((c) => ({
  value: c.value,
  label: c.label,
}));

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>(MOCK_PRODUCTS);
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
      category: "",
      stock: 1,
      deposit: 2000,
      status: "available",
    },
  });

  const category = watch("category");
  const status = watch("status");

  const onSubmit = (data: FormValues) => {
    const next: AdminProduct = {
      id: `p${Date.now()}`,
      name: data.name,
      category: data.category,
      stock: data.stock,
      deposit: data.deposit,
      status: data.status as ProductStatus,
    };
    setProducts((prev) => [next, ...prev]);
    reset();
    setShowForm(false);
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Create and manage rental product records."
        action={
          <div className="w-full sm:w-40">
            <Button type="button" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancel" : "+ Create Product"}
            </Button>
          </div>
        }
      />

      {showForm && (
        <Panel className="mb-6 p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-text">
            New product
          </h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Input
              id="name"
              label="Product name"
              placeholder="Canon EOS R6"
              error={errors.name?.message}
              {...register("name")}
            />
            <Combobox
              label="Category"
              options={categoryOptions}
              value={category}
              onChange={(v) => setValue("category", v, { shouldValidate: true })}
              placeholder="Select category"
              error={errors.category?.message}
            />
            <Input
              id="stock"
              type="number"
              label="Stock"
              error={errors.stock?.message}
              {...register("stock", { valueAsNumber: true })}
            />
            <Input
              id="deposit"
              type="number"
              label="Deposit (₹)"
              error={errors.deposit?.message}
              {...register("deposit", { valueAsNumber: true })}
            />
            <Combobox
              label="Status"
              options={statusOptions}
              value={status}
              onChange={(v) =>
                setValue("status", v as ProductStatus, { shouldValidate: true })
              }
              placeholder="Select status"
              error={errors.status?.message}
            />
            <div className="flex items-end sm:col-span-2">
              <div className="w-full sm:w-48">
                <Button type="submit">Save product</Button>
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
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Deposit</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-white/5">
                  <td className="px-5 py-3 font-medium text-text">{p.name}</td>
                  <td className="px-5 py-3 capitalize text-chalk">
                    {p.category}
                  </td>
                  <td className="px-5 py-3 text-text">{p.stock}</td>
                  <td className="px-5 py-3 text-text">
                    ₹{p.deposit.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                        p.status === "available"
                          ? "bg-green-500/15 text-green-300"
                          : p.status === "rented"
                            ? "bg-accent/15 text-accent"
                            : "bg-yellow-500/15 text-yellow-300"
                      }`}
                    >
                      {p.status}
                    </span>
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
