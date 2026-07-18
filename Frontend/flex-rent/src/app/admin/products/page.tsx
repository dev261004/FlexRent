"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, PackageSearch, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import api from "@/core/api";

type ApiProduct = {
  id: string;
  name: string;
  sku: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  quantityOnHand: number;
  salesPrice: string | number;
  category: { name: string } | null;
  vendor: { fullName: string; companyName: string | null } | null;
};

type ProductsResponse = {
  products: ApiProduct[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const initialPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: ProductsResponse }>("/products", {
        params: { page, limit: 10, sortBy: "createdAt", order: "desc" },
      });
      setProducts(response.data.data.products);
      setPagination(response.data.data.pagination);
    } catch {
      setError("We could not load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const requestId = window.setTimeout(() => {
      void loadProducts(1);
    }, 0);
    return () => window.clearTimeout(requestId);
  }, [loadProducts]);

  return (
    <div>
      <PageHeader
        title="Products"
        description="Browse and manage products from the live rental catalog."
        action={
          <button
            type="button"
            onClick={() => void loadProducts(pagination.page)}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm font-semibold text-text transition hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-text">Product catalog</h2>
            <p className="mt-1 text-sm text-chalk">{pagination.total} product{pagination.total === 1 ? "" : "s"} in your catalog.</p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-chalk">Page {pagination.page} of {pagination.totalPages}</p>
        </div>

        {error ? (
          <div className="p-8 text-center"><p className="text-sm text-danger">{error}</p><button type="button" onClick={() => void loadProducts(pagination.page)} className="mt-4 text-sm font-semibold text-accent hover:text-yellow-400">Try again</button></div>
        ) : loading ? (
          <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />)}</div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center"><div className="rounded-2xl bg-accent/15 p-4 text-accent"><PackageSearch size={28} /></div><h3 className="mt-4 font-display text-lg font-semibold text-text">No products found</h3><p className="mt-1 max-w-sm text-sm text-chalk">Products created by vendors or admins will appear here.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead><tr className="border-b border-border/70 bg-black/[0.02] text-left text-xs uppercase tracking-wider text-chalk dark:bg-white/[0.02]"><th className="px-5 py-3.5 font-semibold sm:px-6">Product</th><th className="px-5 py-3.5 font-semibold">Category</th><th className="px-5 py-3.5 font-semibold">Vendor</th><th className="px-5 py-3.5 font-semibold">Stock</th><th className="px-5 py-3.5 font-semibold">Daily price</th><th className="px-5 py-3.5 font-semibold sm:px-6">Status</th></tr></thead>
              <tbody>{products.map((product) => <tr key={product.id} className="border-t border-border/60 transition hover:bg-accent/[0.035]"><td className="px-5 py-4 sm:px-6"><p className="font-semibold text-text">{product.name}</p><p className="mt-0.5 font-mono text-xs text-chalk">{product.sku ?? "No SKU"}</p></td><td className="px-5 py-4 text-chalk">{product.category?.name ?? "Uncategorized"}</td><td className="px-5 py-4 text-chalk">{product.vendor?.companyName ?? product.vendor?.fullName ?? "—"}</td><td className="px-5 py-4 font-semibold text-text">{product.quantityOnHand}</td><td className="px-5 py-4 font-semibold text-text">{formatMoney(product.salesPrice)}</td><td className="px-5 py-4 sm:px-6"><StatusBadge status={product.status} /></td></tr>)}</tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border px-5 py-4 sm:px-6">
          <p className="text-sm text-chalk">Showing page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2"><button type="button" aria-label="Previous page" onClick={() => void loadProducts(pagination.page - 1)} disabled={loading || pagination.page <= 1} className="rounded-lg border border-border p-2 text-chalk transition hover:border-accent/50 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={18} /></button><button type="button" aria-label="Next page" onClick={() => void loadProducts(pagination.page + 1)} disabled={loading || pagination.page >= pagination.totalPages} className="rounded-lg border border-border p-2 text-chalk transition hover:border-accent/50 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={18} /></button></div>
        </div>
      </Panel>
    </div>
  );
}

function StatusBadge({ status }: { status: ApiProduct["status"] }) {
  const styles = { ACTIVE: "bg-green-500/15 text-green-700 dark:text-green-300", DRAFT: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-300", ARCHIVED: "bg-black/5 text-chalk dark:bg-white/10" };
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}
