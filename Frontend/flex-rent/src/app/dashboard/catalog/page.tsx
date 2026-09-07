"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  PackageSearch,
  Search,
  ShoppingBag,
  Plus,
  Check,
  ArrowRight,
  X,
  ShieldCheck,
} from "lucide-react";
import { getProducts, type Product } from "@/features/customer/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Panel } from "@/components/admin/Panel";
import { getProductImageUrl } from "@/core/image";

const price = (amount: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));

const day = (offset: number) =>
  new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

export default function CatalogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { items, addItem, hasItem, openCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(
    null
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      getProducts(search)
        .then((d) => setProducts(d.products))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const available = useMemo(
    () => products.filter((p) => p.quantityOnHand > 0 && p.vendor),
    [products]
  );

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">
            Rental catalog
          </p>
          <h1 className="font-display text-3xl font-bold text-text sm:text-4xl">
            Browse & Rent Equipment
          </h1>
          <p className="mt-1 text-sm text-chalk">
            Select tools and gear, customize your rental period, and add them to your cart.
          </p>
        </div>

        {items.length > 0 && (
          <Link
            href="/dashboard/cart"
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-black hover:bg-accent/90 transition shadow-md shadow-accent/20"
          >
            <ShoppingBag size={16} />
            <span>View Cart ({items.length} items)</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {/* Search Input */}
      <div className="relative mb-7 max-w-xl">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-chalk"
          size={18}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cameras, power tools, studio gear, or categories..."
          className="w-full rounded-2xl border border-border bg-surface-raised py-3.5 pl-11 pr-4 text-sm text-text outline-none focus:border-accent"
        />
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-84 animate-pulse rounded-2xl bg-surface-raised border border-border/50"
            />
          ))}
        </div>
      ) : available.length === 0 ? (
        <Panel className="p-12 text-center">
          <PackageSearch className="mx-auto text-accent" size={32} />
          <h2 className="mt-4 font-display text-xl font-bold text-text">
            No available rental products found
          </h2>
          <p className="mt-2 text-sm text-chalk">
            Try a different search query, or check back when inventory is updated.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {available.map((product) => {
            const inCart = hasItem(product.id);
            const deposit = product.rentalConfig?.securityDeposit ?? "0";

            return (
              <article
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised transition hover:-translate-y-1 hover:border-accent/60 shadow-sm"
              >
                {/* Product Image */}
                <div className="relative h-48 w-full overflow-hidden bg-surface">
                  <img
                    src={getProductImageUrl(product.primaryImage?.url)}
                    alt={product.primaryImage?.altText ?? product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {inCart && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-[11px] font-bold text-black shadow-md">
                      <Check size={13} className="stroke-[3]" />
                      In Cart
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-accent">
                          {product.category?.name ?? "Equipment"}
                        </p>
                        <h2 className="mt-1 font-display text-lg font-bold text-text line-clamp-1">
                          {product.name}
                        </h2>
                      </div>
                      <span className="shrink-0 rounded-lg bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-600 dark:text-green-300">
                        {product.quantityOnHand} in stock
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 h-10 text-xs leading-relaxed text-chalk">
                      {product.description ??
                        "High-grade equipment ready for your project or event."}
                    </p>

                    {/* Deposit info banner */}
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-chalk">
                      <ShieldCheck size={13} className="text-green-500" />
                      <span>
                        Refundable Deposit:{" "}
                        <strong className="text-text font-medium">
                          {price(deposit)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Pricing & Add to Cart Footer */}
                  <div className="mt-5 border-t border-border/60 pt-4 flex items-center justify-between">
                    <div>
                      <p className="font-display text-xl font-bold text-text">
                        {price(product.salesPrice)}
                      </p>
                      <p className="text-[11px] text-chalk">
                        per{" "}
                        {product.rentalConfig?.rentalRateUnit?.toLowerCase() ??
                          "day"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setConfiguringProduct(product)}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                        inCart
                          ? "border border-accent/40 bg-accent/15 text-accent hover:bg-accent/25"
                          : "bg-accent text-black hover:bg-accent/90 shadow-accent/20"
                      }`}
                    >
                      <Plus size={15} />
                      <span>{inCart ? "Edit Dates / Add" : "Add to Cart"}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Configure & Add to Cart Modal */}
      {configuringProduct && (
        <AddToCartModal
          product={configuringProduct}
          onClose={() => setConfiguringProduct(null)}
          onAdded={() => {
            setConfiguringProduct(null);
            openCart();
          }}
          onCheckout={() => {
            setConfiguringProduct(null);
            router.push("/dashboard/cart");
          }}
        />
      )}
    </div>
  );
}

function AddToCartModal({
  product,
  onClose,
  onAdded,
  onCheckout,
}: {
  product: Product;
  onClose: () => void;
  onAdded: () => void;
  onCheckout: () => void;
}) {
  const { addItem } = useCart();
  const [start, setStart] = useState(day(1));
  const [end, setEnd] = useState(day(3));
  const [quantity, setQuantity] = useState(1);

  const days = useMemo(() => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
  }, [start, end]);

  const estimatedTotal = Number(product.salesPrice) * days * quantity;
  const deposit =
    Number(product.rentalConfig?.securityDeposit ?? 0) * quantity;

  const handleAdd = () => {
    addItem(product, {
      rentalStart: start,
      rentalEnd: end,
      quantity,
    });
    onAdded();
  };

  const handleImmediateCheckout = () => {
    addItem(product, {
      rentalStart: start,
      rentalEnd: end,
      quantity,
    });
    onCheckout();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-surface-raised shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border p-6 bg-surface/50">
          <div className="flex items-center gap-3">
            <img
              src={getProductImageUrl(product.primaryImage?.url)}
              alt={product.name}
              className="h-14 w-14 rounded-xl object-cover bg-surface border border-border"
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
                Configure Rental
              </p>
              <h3 className="font-display text-lg font-bold text-text line-clamp-1">
                {product.name}
              </h3>
              <p className="text-xs text-chalk">
                Vendor: {product.vendor?.fullName ?? "FlexRent Partner"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <div className="p-6 space-y-5">
          {/* Rental Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={start}
                min={day(1)}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-text focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Return Date ({days} Days)
              </label>
              <input
                type="date"
                required
                value={end}
                min={start}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-text focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Quantity
            </label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-text focus:border-accent focus:outline-none"
            >
              {Array.from(
                { length: Math.min(product.quantityOnHand, 10) },
                (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1} {i === 0 ? "unit" : "units"}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Estimate Card */}
          <div className="rounded-2xl bg-surface/80 p-4 border border-border space-y-2 text-xs">
            <div className="flex justify-between text-chalk">
              <span>Rental Rate</span>
              <span className="font-mono text-text">
                {price(product.salesPrice)} × {days} days × {quantity}
              </span>
            </div>
            <div className="flex justify-between text-chalk">
              <span>Estimated Rental Charge</span>
              <span className="font-mono font-bold text-text">
                {price(estimatedTotal)}
              </span>
            </div>
            <div className="flex justify-between text-chalk">
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-green-500" />
                Refundable Deposit
              </span>
              <span className="font-mono font-bold text-green-400">
                + {price(deposit)}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-text">
              <span>Total Payable</span>
              <span className="font-display text-sm text-accent">
                {price(estimatedTotal + deposit)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/15 py-3 text-xs font-bold text-accent hover:bg-accent/25 transition"
            >
              <Plus size={15} />
              <span>Add to Cart</span>
            </button>

            <button
              type="button"
              onClick={handleImmediateCheckout}
              className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-xs font-bold text-black hover:bg-accent/90 transition shadow-md shadow-accent/20"
            >
              <span>Rent & Checkout</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
