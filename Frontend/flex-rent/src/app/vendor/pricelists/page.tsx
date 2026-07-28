"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, X, ChevronRight, List, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import {
  listPriceLists,
  createPriceList,
  deletePriceList,
  createPriceListRule,
  listPriceListRules,
  deletePriceListRule,
  type PriceList,
  type PriceListRule
} from "@/features/pricing/api";
import { listProducts, type Product } from "@/features/products/api";

type RuleForm = {
  productId: string;
  ruleType: "DISCOUNT" | "FIXED_PRICE";
  discountPercent: string;
  fixedPrice: string;
  minDuration: string;
  durationUnit: string;
};

export default function VendorPricelistsPage() {
  const [pricelists, setPricelists] = useState<PriceList[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<RuleForm[]>([]);
  
  const [selectedPricelist, setSelectedPricelist] = useState<PriceList | null>(null);
  const [selectedRules, setSelectedRules] = useState<PriceListRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [plData, prodData] = await Promise.all([
        listPriceLists(),
        listProducts({ limit: 100, status: "ACTIVE" })
      ]);
      setPricelists(plData);
      setProducts(prodData.products);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    
    try {
      setCreating(true);
      const pl = await createPriceList({ name, description });
      
      for (const rule of rules) {
        await createPriceListRule(pl.id, {
          productId: rule.productId || null,
          ruleType: rule.ruleType,
          discountPercent: rule.ruleType === "DISCOUNT" ? Number(rule.discountPercent) : null,
          fixedPrice: rule.ruleType === "FIXED_PRICE" ? Number(rule.fixedPrice) : null,
          minDuration: rule.minDuration ? Number(rule.minDuration) : null,
          durationUnit: rule.durationUnit || null,
        });
      }
      
      toast.success("Pricelist created successfully!");
      setShowCreate(false);
      setName("");
      setDescription("");
      setRules([]);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create pricelist");
    } finally {
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!listToDelete) return;
    try {
      setDeleting(true);
      await deletePriceList(listToDelete);
      toast.success("Deleted successfully");
      await fetchData();
      if (selectedPricelist?.id === listToDelete) setSelectedPricelist(null);
    } catch (err: any) {
      toast.error("Failed to delete pricelist");
    } finally {
      setDeleting(false);
      setListToDelete(null);
    }
  }

  async function loadRules(pl: PriceList) {
    setSelectedPricelist(pl);
    setLoadingRules(true);
    try {
      const data = await listPriceListRules(pl.id);
      setSelectedRules(data);
    } catch (err) {
      toast.error("Failed to load rules");
    } finally {
      setLoadingRules(false);
    }
  }

  function addRule() {
    setRules([...rules, {
      productId: "",
      ruleType: "DISCOUNT",
      discountPercent: "",
      fixedPrice: "",
      minDuration: "1",
      durationUnit: "DAY"
    }]);
  }

  function updateRule(index: number, field: keyof RuleForm, value: string) {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  }

  function removeRule(index: number) {
    setRules(rules.filter((_, i) => i !== index));
  }

  return (
    <div>
      <PageHeader
        title="Dynamic Pricelists"
        description="Create duration-based pricing rules and discounts for your products."
        action={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-400"
          >
            {showCreate ? "Cancel" : <><Plus size={18} /> Create Pricelist</>}
          </button>
        }
      />

      {showCreate && (
        <Panel className="mb-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-text">New Pricelist Builder</h2>
              <p className="mt-1 text-sm text-chalk">Configure long-term discounts and packages.</p>
            </div>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-chalk hover:bg-black/5 dark:hover:bg-white/5"><X size={20}/></button>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-text">
                Pricelist Name
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Special" className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text" />
              </label>
              <label className="text-sm font-semibold text-text">
                Description
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text" />
              </label>
            </div>

            <div className="rounded-xl border border-border bg-black/[0.02] p-5 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text">Duration Rules</h3>
                <button type="button" onClick={addRule} className="inline-flex items-center gap-1 rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold text-text border border-border hover:border-accent">
                  <Plus size={15}/> Add Rule
                </button>
              </div>

              {rules.length === 0 ? (
                <p className="text-sm text-chalk text-center py-4">No rules added yet. Click "Add Rule" to configure discounts.</p>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="relative rounded-xl border border-border bg-surface p-4">
                      <button type="button" onClick={() => removeRule(idx)} className="absolute right-3 top-3 text-red-500 hover:text-red-600"><Trash2 size={16}/></button>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pr-6">
                        <label className="text-sm font-semibold text-text">
                          Product
                          <select value={rule.productId} onChange={e => updateRule(idx, "productId", e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text">
                            <option value="">All Products</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </label>

                        <label className="text-sm font-semibold text-text">
                          Min. Duration
                          <div className="flex mt-1 gap-2">
                            <input type="number" min="1" value={rule.minDuration} onChange={e => updateRule(idx, "minDuration", e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text" />
                            <select value={rule.durationUnit} onChange={e => updateRule(idx, "durationUnit", e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2 text-text">
                              <option value="HOUR">Hour</option><option value="DAY">Day</option><option value="WEEK">Week</option><option value="MONTH">Month</option>
                            </select>
                          </div>
                        </label>

                        <label className="text-sm font-semibold text-text">
                          Pricing Type
                          <select value={rule.ruleType} onChange={e => updateRule(idx, "ruleType", e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text">
                            <option value="DISCOUNT">Percentage Discount</option>
                            <option value="FIXED_PRICE">Fixed Package Price</option>
                          </select>
                        </label>

                        {rule.ruleType === "DISCOUNT" ? (
                          <label className="text-sm font-semibold text-text">
                            Discount (%)
                            <input type="number" min="1" max="100" value={rule.discountPercent} onChange={e => updateRule(idx, "discountPercent", e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text" />
                          </label>
                        ) : (
                          <label className="text-sm font-semibold text-text">
                            Fixed Amount (₹)
                            <input type="number" min="1" value={rule.fixedPrice} onChange={e => updateRule(idx, "fixedPrice", e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text" />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={creating} className="w-full sm:w-auto inline-flex justify-center rounded-xl bg-accent px-6 py-3 font-bold text-black disabled:opacity-50">
              {creating ? "Saving..." : "Save Pricelist & Rules"}
            </button>
          </form>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <Panel>
          <div className="border-b border-border p-5">
            <h3 className="font-display text-lg font-bold text-text">Active Pricelists</h3>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />)}
            </div>
          ) : pricelists.length === 0 ? (
            <div className="p-12 text-center">
              <List className="mx-auto text-chalk mb-3" size={32}/>
              <p className="text-text font-semibold">No pricelists found</p>
              <p className="text-sm text-chalk mt-1">Create one to offer duration discounts.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-black/[0.02] text-left text-xs uppercase tracking-wider text-chalk dark:bg-white/[0.02]">
                    <th className="px-5 py-4 font-semibold">Name</th>
                    <th className="px-5 py-4 font-semibold">Description</th>
                    <th className="px-5 py-4 font-semibold">Rules</th>
                    <th className="px-5 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pricelists.map(pl => (
                    <tr key={pl.id} onClick={() => loadRules(pl)} className={`border-b border-border/50 cursor-pointer transition hover:bg-black/[0.02] dark:hover:bg-white/[0.02] ${selectedPricelist?.id === pl.id ? 'bg-accent/5' : ''}`}>
                      <td className="px-5 py-4 font-semibold text-text">{pl.name}</td>
                      <td className="px-5 py-4 text-chalk">{pl.description || "-"}</td>
                      <td className="px-5 py-4 text-text"><span className="inline-flex rounded-full bg-black/5 px-2.5 py-1 text-xs font-bold dark:bg-white/10">{pl.ruleCount} Rules</span></td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={(e) => { e.stopPropagation(); loadRules(pl); }} className="rounded-lg p-2 text-chalk hover:bg-black/5 hover:text-text"><ChevronRight size={16}/></button>
                          <button onClick={(e) => { e.stopPropagation(); setListToDelete(pl.id); }} className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {selectedPricelist && (
          <Panel className="h-fit">
            <div className="border-b border-border p-5">
              <h3 className="font-display text-lg font-bold text-text">{selectedPricelist.name}</h3>
              <p className="text-xs text-chalk mt-1">Pricing Rules Breakdown</p>
            </div>
            <div className="p-5">
              {loadingRules ? (
                 <div className="h-20 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
              ) : selectedRules.length === 0 ? (
                <p className="text-sm text-chalk text-center py-6">No rules configured in this pricelist.</p>
              ) : (
                <div className="space-y-3">
                  {selectedRules.map(rule => (
                    <div key={rule.id} className="rounded-xl border border-border bg-surface-raised p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-accent">
                          {rule.minDuration ? `${rule.minDuration}+ ${rule.durationUnit}s` : "Any Duration"}
                        </span>
                        <span className="text-xs font-semibold text-text bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md">
                          {rule.ruleType === "DISCOUNT" ? `${rule.discountPercent}% OFF` : `₹${rule.fixedPrice} FLAT`}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-text">
                        {rule.product ? rule.product.name : "Applies to all products"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        )}
      </div>

      {listToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl">
            <div className="flex items-center gap-4 text-red-500">
              <div className="rounded-full bg-red-500/10 p-3">
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-display text-xl font-bold">Delete Pricelist</h3>
            </div>
            <p className="mt-4 text-sm text-chalk">
              Are you sure you want to delete this pricelist? All duration rules inside it will be permanently deleted and it will no longer apply to your products.
            </p>
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setListToDelete(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-chalk transition hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Pricelist"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
