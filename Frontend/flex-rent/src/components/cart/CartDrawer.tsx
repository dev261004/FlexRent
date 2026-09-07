"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Trash2,
  CalendarDays,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Package,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { getProductImageUrl } from "@/core/image";

const formatPrice = (amount: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    itemCount,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();

  if (!isCartOpen) return null;

  // Calculate approximate totals for quick preview
  const estimatedSubtotal = items.reduce((sum, item) => {
    const start = new Date(item.rentalStart);
    const end = new Date(item.rentalEnd);
    const diffDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    return sum + Number(item.salesPrice) * diffDays * item.quantity;
  }, 0);

  const estimatedDeposit = items.reduce(
    (sum, item) => sum + Number(item.securityDeposit) * item.quantity,
    0
  );

  const handleCheckoutClick = () => {
    closeCart();
    router.push("/dashboard/cart");
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-surface-raised shadow-2xl transition-transform duration-300 animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-accent/15 p-2 text-accent">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-text">
                Your Rental Cart
              </h2>
              <p className="text-xs text-chalk">
                {itemCount} {itemCount === 1 ? "item" : "items"} selected
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-xl p-2 text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5 transition"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <div className="rounded-3xl bg-surface p-6 text-chalk">
                <Package size={44} className="stroke-[1.5]" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-text">
                Cart is currently empty
              </h3>
              <p className="mt-1 text-xs text-chalk max-w-xs">
                Explore our catalog to find premium tools, cameras, and equipment for your next project.
              </p>
              <Link
                href="/dashboard/catalog"
                onClick={closeCart}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-black hover:bg-accent/90 transition shadow-sm shadow-accent/20"
              >
                Browse Catalog
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const start = new Date(item.rentalStart);
                const end = new Date(item.rentalEnd);
                const days = Math.max(
                  1,
                  Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                );
                const itemTotal = Number(item.salesPrice) * days * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="relative flex gap-3.5 rounded-2xl border border-border/80 bg-surface/60 p-3.5 transition hover:border-accent/40"
                  >
                    {/* Thumbnail */}
                    <img
                      src={getProductImageUrl(item.imageUrl)}
                      alt={item.name}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover bg-surface"
                    />

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display text-sm font-bold text-text line-clamp-1">
                            {item.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-chalk hover:text-danger p-1 transition"
                            title="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <p className="text-[11px] text-chalk mt-0.5">
                          Vendor: <span className="font-medium text-text">{item.vendorName}</span>
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-accent">
                          <CalendarDays size={13} />
                          <span>
                            {item.rentalStart} → {item.rentalEnd} ({days}d)
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        {/* Quantity controls */}
                        <div className="flex items-center rounded-lg border border-border bg-surface px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-2 py-0.5 text-xs font-bold text-text disabled:opacity-30"
                          >
                            -
                          </button>
                          <span className="px-1.5 text-xs font-semibold text-text">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.quantityOnHand}
                            className="px-2 py-0.5 text-xs font-bold text-text disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="font-display text-sm font-bold text-text">
                            {formatPrice(itemTotal)}
                          </p>
                          <p className="text-[10px] text-chalk">
                            + {formatPrice(Number(item.securityDeposit) * item.quantity)} deposit
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Summary & Checkout Button */}
        {items.length > 0 && (
          <div className="border-t border-border bg-surface/50 p-6 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-chalk">
                <span>Rental Subtotal</span>
                <span className="font-medium text-text">
                  {formatPrice(estimatedSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-chalk">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={13} className="text-green-500" />
                  Refundable Deposit
                </span>
                <span className="font-medium text-text">
                  {formatPrice(estimatedDeposit)}
                </span>
              </div>
              <div className="border-t border-border/80 pt-2 flex justify-between text-sm font-bold text-text">
                <span>Est. Grand Total</span>
                <span className="font-display text-base text-accent">
                  {formatPrice(estimatedSubtotal + estimatedDeposit)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleCheckoutClick}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-black hover:bg-accent/90 transition shadow-md shadow-accent/20"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-chalk hover:text-danger transition"
                >
                  Clear all items
                </button>
                <button
                  type="button"
                  onClick={closeCart}
                  className="text-chalk hover:text-text transition"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
