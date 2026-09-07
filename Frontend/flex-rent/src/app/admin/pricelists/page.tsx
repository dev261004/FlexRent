"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Plus, Trash2, RefreshCw, Star, Tag, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Combobox } from "@/components/ui/Combobox";
import {
  listPriceLists,
  createPriceList,
  deletePriceList,
  type PriceList,
} from "@/features/pricing/api";
import { getProducts, type Product } from "@/features/customer/api";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

export default function AdminPricelistsPage() {
  const [pricelists, setPricelists] = useState<PriceList[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
    },
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [plData, prodData] = await Promise.allSettled([
        listPriceLists(),
        getProducts(),
      ]);

      if (plData.status === "fulfilled" && Array.isArray(plData.value)) {
        setPricelists(plData.value);
      }

      if (prodData.status === "fulfilled" && prodData.value?.products) {
        setProducts(prodData.value.products);
      }
    } catch {
      toast.error("Failed to load pricelists");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      const created = await createPriceList({
        name: data.name,
        description: data.description || null,
        isDefault: data.isDefault,
        isActive: true,
      });

      toast.success(`Pricelist "${created.name}" created successfully!`);
      setPricelists((prev) => {
        const nextList = data.isDefault
          ? prev.map((p) => ({ ...p, isDefault: false }))
          : [...prev];
        return [created, ...nextList];
      });

      reset();
      setShowForm(false);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create pricelist";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete pricelist "${name}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deletePriceList(id);
      toast.success(`Deleted pricelist "${name}"`);
      setPricelists((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete pricelist";
      toast.error(errorMsg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Pricelists"
        description="Create and configure active pricing schedules and discount rules for catalog products."
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-chalk hover:text-text hover:bg-white/5 transition"
              title="Refresh pricelists"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-accent" : ""} />
              <span>Refresh</span>
            </button>
            <div className="w-full sm:w-44">
              <Button type="button" onClick={() => setShowForm((v) => !v)}>
                {showForm ? "Cancel" : "+ Create Pricelist"}
              </Button>
            </div>
          </div>
        }
      />

      {showForm && (
        <Panel className="mb-6 p-6 border-accent/30 shadow-xl">
          <h2 className="mb-4 font-display text-lg font-semibold text-text">
            New Pricelist
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="pl-name"
                label="Pricelist Name"
                placeholder="e.g. Weekend Special, Peak Season 2026"
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                id="pl-desc"
                label="Description (Optional)"
                placeholder="e.g. Standard rates for weekend rentals"
                {...register("description")}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="pl-default"
                type="checkbox"
                className="rounded border-border bg-surface text-accent focus:ring-accent"
                {...register("isDefault")}
              />
              <label htmlFor="pl-default" className="text-xs font-medium text-text cursor-pointer">
                Set as Default Organization Pricelist
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="w-44">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Save Pricelist"}
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

      <Panel>
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-text">Configured Pricelists</h2>
            <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-chalk">
              {pricelists.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-black/[0.02] text-left text-xs uppercase tracking-wider text-chalk dark:bg-white/[0.02]">
                <th className="px-5 py-3.5 font-semibold sm:px-6">Pricelist Name</th>
                <th className="px-5 py-3.5 font-semibold">Description</th>
                <th className="px-5 py-3.5 font-semibold text-center">Rules Configured</th>
                <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && pricelists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-chalk">
                    <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-accent" />
                    Loading pricelists...
                  </td>
                </tr>
              ) : pricelists.length > 0 ? (
                pricelists.map((pl) => (
                  <tr key={pl.id} className="transition hover:bg-accent/[0.035]">
                    <td className="px-5 py-4 font-medium text-text sm:px-6">
                      <div className="flex items-center gap-2">
                        <span>{pl.name}</span>
                        {pl.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-400 border border-amber-500/20">
                            <Star size={10} className="fill-amber-400" /> Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-chalk">
                      {pl.description || "—"}
                    </td>
                    <td className="px-5 py-4 text-center font-mono text-xs text-text">
                      <span className="rounded-lg bg-surface px-2.5 py-1 border border-border">
                        {pl.ruleCount ?? 0} rules
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          pl.isActive
                            ? "bg-green-500/15 text-green-700 dark:text-green-300"
                            : "bg-black/5 text-chalk dark:bg-white/10"
                        }`}
                      >
                        {pl.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right sm:px-6">
                      <button
                        type="button"
                        onClick={() => handleDelete(pl.id, pl.name)}
                        disabled={deletingId === pl.id}
                        className="rounded-lg p-2 text-chalk hover:bg-danger/10 hover:text-danger transition"
                        title="Delete pricelist"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-chalk">
                    No pricelists configured yet. Click "+ Create Pricelist" to add your first rate schedule.
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
