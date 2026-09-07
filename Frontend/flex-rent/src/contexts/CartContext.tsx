"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import type { Product } from "@/features/customer/api";

const STORAGE_KEY = "flexrent_cart_v1";

const defaultDay = (offset: number) =>
  new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  categoryName?: string;
  vendorId: string;
  vendorName?: string;
  salesPrice: string;
  securityDeposit: string;
  rentalRateUnit?: string;
  quantityOnHand: number;
  quantity: number;
  rentalStart: string; // YYYY-MM-DD
  rentalEnd: string; // YYYY-MM-DD
  fulfillmentOptions?: any;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  uniqueItemCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (
    product: Product & { fulfillmentOptions?: any },
    options?: {
      quantity?: number;
      rentalStart?: string;
      rentalEnd?: string;
      variantId?: string;
    }
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateDates: (cartItemId: string, rentalStart: string, rentalEnd: string) => void;
  applyDatesToAll: (rentalStart: string, rentalEnd: string) => void;
  clearCart: () => void;
  hasItem: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage quota or disabled
    }
  }, [items, isHydrated]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const addItem = useCallback(
    (
      product: Product & { fulfillmentOptions?: any },
      options?: {
        quantity?: number;
        rentalStart?: string;
        rentalEnd?: string;
        variantId?: string;
      }
    ) => {
      const quantityToAdd = Math.max(1, options?.quantity ?? 1);
      const start = options?.rentalStart ?? defaultDay(1);
      const end = options?.rentalEnd ?? defaultDay(3);
      const variantId = options?.variantId;
      const cartItemId = variantId ? `${product.id}-${variantId}` : product.id;

      setItems((prev) => {
        const existingIndex = prev.findIndex((it) => it.id === cartItemId);
        if (existingIndex > -1) {
          const existing = prev[existingIndex];
          const newQty = Math.min(
            existing.quantity + quantityToAdd,
            product.quantityOnHand || 99
          );
          const updated = [...prev];
          updated[existingIndex] = {
            ...existing,
            quantity: newQty,
            rentalStart: options?.rentalStart ?? existing.rentalStart,
            rentalEnd: options?.rentalEnd ?? existing.rentalEnd,
          };
          toast.success(`Updated ${product.name} quantity to ${newQty}`);
          return updated;
        }

        const vendorId = product.vendor?.id;
        if (!vendorId) {
          toast.error("Cannot add product: No vendor associated.");
          return prev;
        }

        const vendorName =
          product.vendor.fullName || product.vendor.companyName || "Vendor";

        const newItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          variantId,
          name: product.name,
          slug: product.slug,
          description: product.description,
          imageUrl: product.primaryImage?.url ?? null,
          categoryName: product.category?.name ?? "General",
          vendorId,
          vendorName,
          salesPrice: product.salesPrice,
          securityDeposit: product.rentalConfig?.securityDeposit ?? "0",
          rentalRateUnit: product.rentalConfig?.rentalRateUnit ?? "DAY",
          quantityOnHand: product.quantityOnHand,
          quantity: Math.min(quantityToAdd, product.quantityOnHand || 99),
          rentalStart: start,
          rentalEnd: end,
          fulfillmentOptions: product.fulfillmentOptions,
        };

        toast.success(`Added ${product.name} to cart!`);
        return [...prev, newItem];
      });
    },
    []
  );

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => {
      const item = prev.find((it) => it.id === cartItemId);
      if (item) {
        toast(`Removed ${item.name} from cart`);
      }
      return prev.filter((it) => it.id !== cartItemId);
    });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === cartItemId) {
          const bounded = Math.max(1, Math.min(quantity, it.quantityOnHand || 99));
          return { ...it, quantity: bounded };
        }
        return it;
      })
    );
  }, []);

  const updateDates = useCallback(
    (cartItemId: string, rentalStart: string, rentalEnd: string) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id === cartItemId) {
            return { ...it, rentalStart, rentalEnd };
          }
          return it;
        })
      );
    },
    []
  );

  const applyDatesToAll = useCallback(
    (rentalStart: string, rentalEnd: string) => {
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          rentalStart,
          rentalEnd,
        }))
      );
      toast.success("Updated rental dates for all items in cart");
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const hasItem = useCallback(
    (productId: string) => items.some((it) => it.productId === productId),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity, 0),
    [items]
  );

  const uniqueItemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        uniqueItemCount,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        removeItem,
        updateQuantity,
        updateDates,
        applyDatesToAll,
        clearCart,
        hasItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
