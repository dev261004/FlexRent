"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ShoppingBag,
  Trash2,
  CalendarDays,
  Truck,
  Store,
  CreditCard,
  QrCode,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  FileDown,
  ExternalLink,
  MapPin,
  Clock,
  AlertCircle,
  Package,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Panel } from "@/components/admin/Panel";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getProductImageUrl } from "@/core/image";
import {
  previewCartCheckout,
  checkoutCart,
  downloadRentalOrderInvoice,
  type CartCheckoutPreviewResult,
  type RentalOrder,
} from "@/features/customer/api";

const formatPrice = (amount: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const getDays = (start: string, end: string) => {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
};

export default function CartCheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    itemCount,
    removeItem,
    updateQuantity,
    updateDates,
    applyDatesToAll,
    clearCart,
  } = useCart();

  // Fulfillment State
  const [fulfillmentMethod, setFulfillmentMethod] = useState<
    "HOME_DELIVERY" | "STORE_PICKUP"
  >("HOME_DELIVERY");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<
    "UPI" | "CARD" | "CASH" | "BANK_TRANSFER" | "ONLINE"
  >("UPI");
  const [transactionId, setTransactionId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Preview & Submission State
  const [preview, setPreview] = useState<CartCheckoutPreviewResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrders, setCreatedOrders] = useState<RentalOrder[] | null>(null);

  // Load saved preferences
  useEffect(() => {
    try {
      const prefs = JSON.parse(
        localStorage.getItem("flexrent_preferences") ?? "{}"
      );
      if (prefs.addresses && Array.isArray(prefs.addresses) && prefs.addresses.length > 0) {
        setSavedAddresses(prefs.addresses);
        setAddressLine1(prefs.addresses[0]);
      } else if (prefs.address) {
        setSavedAddresses([prefs.address]);
        setAddressLine1(prefs.address);
      }
      if (prefs.city) setCity(prefs.city);
      if (prefs.state) setState(prefs.state);
      if (prefs.postalCode) setPostalCode(prefs.postalCode);
      if (prefs.payment) setPaymentMethod(prefs.payment);
      if (prefs.fulfilment === "pickup") setFulfillmentMethod("STORE_PICKUP");
    } catch {}
  }, []);

  // Fetch live backend preview whenever cart items or their dates change
  const fetchPreview = useCallback(async () => {
    if (items.length === 0) {
      setPreview(null);
      return;
    }

    try {
      setIsPreviewLoading(true);
      const res = await previewCartCheckout({
        items: items.map((it) => ({
          productId: it.productId,
          variantId: it.variantId,
          quantity: it.quantity,
          rentalStart: new Date(it.rentalStart).toISOString(),
          rentalEnd: new Date(it.rentalEnd).toISOString(),
        })),
      });
      setPreview(res);
    } catch (err: unknown) {
      // Fallback calculation if backend preview fails
      const fallbackSubtotal = items.reduce((sum, item) => {
        const days = getDays(item.rentalStart, item.rentalEnd);
        return sum + Number(item.salesPrice) * days * item.quantity;
      }, 0);
      const fallbackDeposit = items.reduce(
        (sum, item) => sum + Number(item.securityDeposit) * item.quantity,
        0
      );
      setPreview({
        subtotal: String(fallbackSubtotal),
        securityDepositAmount: String(fallbackDeposit),
        grandTotal: String(fallbackSubtotal + fallbackDeposit),
        itemCount: items.reduce((sum, it) => sum + it.quantity, 0),
        items: [],
        vendorGroups: [],
      });
    } finally {
      setIsPreviewLoading(false);
    }
  }, [items]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPreview]);

  // Handle Order Placement
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to complete your rental order.");
      router.push("/login");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    if (fulfillmentMethod === "HOME_DELIVERY" && !addressLine1.trim()) {
      toast.error("Please provide a delivery address line.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Save preferences to localStorage
      try {
        const prefs = JSON.parse(
          localStorage.getItem("flexrent_preferences") ?? "{}"
        );
        let updatedAddrs = [...savedAddresses];
        if (addressLine1.trim() && !updatedAddrs.includes(addressLine1.trim())) {
          updatedAddrs.push(addressLine1.trim());
        }
        localStorage.setItem(
          "flexrent_preferences",
          JSON.stringify({
            ...prefs,
            addresses: updatedAddrs,
            city,
            state,
            postalCode,
            fulfilment: fulfillmentMethod === "HOME_DELIVERY" ? "delivery" : "pickup",
            payment: paymentMethod,
          })
        );
      } catch {}

      const res = await checkoutCart({
        fulfillmentMethod,
        deliveryAddress:
          fulfillmentMethod === "HOME_DELIVERY"
            ? {
                addressLine1: addressLine1.trim(),
                addressLine2: addressLine2.trim() || undefined,
                city: city.trim() || "Local City",
                state: state.trim() || "State",
                postalCode: postalCode.trim() || "000000",
                country: country.trim() || "India",
              }
            : undefined,
        pickupAddress:
          fulfillmentMethod === "STORE_PICKUP"
            ? {
                addressLine1: "FlexRent Partner Store / Hub",
                city: "Local Hub",
                state: "State",
                postalCode: "000000",
                country: "India",
              }
            : undefined,
        paymentMethod,
        paymentDetails: transactionId.trim()
          ? {
              transactionId: transactionId.trim(),
              notes: paymentNotes.trim() || undefined,
            }
          : undefined,
        notes: orderNotes.trim() || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          variantId: it.variantId,
          quantity: it.quantity,
          rentalStart: new Date(it.rentalStart).toISOString(),
          rentalEnd: new Date(it.rentalEnd).toISOString(),
        })),
      });

      toast.success(
        `Successfully placed ${res.orderCount} rental order(s)!`
      );
      setCreatedOrders(res.orders);
      clearCart();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        "Failed to place rental orders. Please check your dates and try again.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (createdOrders && createdOrders.length > 0) {
    return (
      <div className="mx-auto max-w-3xl py-6">
        <Panel className="p-8 text-center sm:p-10 border-green-500/30 shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 text-green-500 ring-8 ring-green-500/10">
            <CheckCircle2 size={48} />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Booking Confirmed
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-text sm:text-4xl">
            Your Rental Orders Are Placed!
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-chalk leading-relaxed">
            Thank you for renting with FlexRent. Your equipment has been reserved,
            and quotation orders have been dispatched to vendors for dispatch/prep.
          </p>

          {/* Created Orders Card List */}
          <div className="mt-8 space-y-3 text-left">
            <h2 className="text-xs font-bold uppercase tracking-wider text-chalk">
              Generated Rental Order(s):
            </h2>
            {createdOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold text-text">
                      {order.rentalNumber}
                    </span>
                    <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold text-accent uppercase">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-chalk mt-1">
                    Dates: {new Date(order.rentalStart).toLocaleDateString("en-IN")} →{" "}
                    {new Date(order.rentalEnd).toLocaleDateString("en-IN")}
                  </p>
                  <p className="text-xs text-chalk">
                    Total: <span className="font-bold text-text">{formatPrice(order.grandTotal)}</span>{" "}
                    (Deposit: {formatPrice(order.securityDepositAmount)})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadRentalOrderInvoice(order.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-surface-raised px-3.5 py-2 text-xs font-bold text-text hover:bg-white/10 transition shadow-sm"
                  >
                    <FileDown size={15} className="text-accent" />
                    <span>Download Invoice</span>
                  </button>

                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-bold text-black hover:bg-accent/90 transition shadow-sm shadow-accent/20"
                  >
                    <span>View Order</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/orders"
              className="w-full sm:w-auto rounded-xl bg-accent px-6 py-3 text-sm font-bold text-black hover:bg-accent/90 transition shadow-md shadow-accent/20"
            >
              Go to My Bookings
            </Link>
            <Link
              href="/dashboard/catalog"
              className="w-full sm:w-auto rounded-xl border border-border bg-surface px-6 py-3 text-sm font-bold text-chalk hover:text-text hover:bg-white/5 transition"
            >
              Rent More Equipment
            </Link>
          </div>
        </Panel>
      </div>
    );
  }

  // EMPTY CART SCREEN
  if (items.length === 0) {
    return (
      <div>
        <PageHeader
          title="Shopping Cart & Checkout"
          description="Manage your selected items, rental periods, shipping details, and security deposit payments."
        />
        <Panel className="p-12 text-center max-w-2xl mx-auto">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-surface text-chalk">
            <Package size={44} className="stroke-[1.5]" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-bold text-text">
            Your shopping cart is empty
          </h2>
          <p className="mt-2 text-sm text-chalk max-w-md mx-auto">
            You have no products in your rental cart. Browse our catalog to select
            cameras, electronics, tools, or event equipment.
          </p>
          <div className="mt-8">
            <Link
              href="/dashboard/catalog"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-bold text-black hover:bg-accent/90 transition shadow-md shadow-accent/20"
            >
              <ShoppingBag size={18} />
              <span>Browse Rental Catalog</span>
            </Link>
          </div>
        </Panel>
      </div>
    );
  }

  const subtotalDisplay = preview ? Number(preview.subtotal) : 0;
  const depositDisplay = preview ? Number(preview.securityDepositAmount) : 0;
  const grandTotalDisplay = preview ? Number(preview.grandTotal) : 0;

  return (
    <div className="pb-12">
      <PageHeader
        title="Shopping Cart & Checkout"
        description="Configure your rental periods, select shipping or store collection, and review your security deposit."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchPreview}
              disabled={isPreviewLoading}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-chalk hover:text-text hover:bg-white/5 transition"
            >
              <RefreshCw
                size={14}
                className={isPreviewLoading ? "animate-spin text-accent" : ""}
              />
              <span>Refresh Calculation</span>
            </button>
            <button
              type="button"
              onClick={clearCart}
              className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/20 transition"
            >
              Clear Cart
            </button>
          </div>
        }
      />

      <form onSubmit={handlePlaceOrder}>
        <div className="grid gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: Items, Fulfillment, Payment */}
          <div className="space-y-6 lg:col-span-8">
            {/* 1. CART ITEMS LIST */}
            <Panel className="p-6">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-accent/15 p-2 text-accent">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-text">
                      1. Rental Items & Durations
                    </h2>
                    <p className="text-xs text-chalk">
                      Adjust rental periods and quantities for each item
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-chalk">
                  {itemCount} {itemCount === 1 ? "unit" : "units"}
                </span>
              </div>

              <div className="divide-y divide-border/60">
                {items.map((item, idx) => {
                  const days = getDays(item.rentalStart, item.rentalEnd);
                  const itemEstimatedTotal =
                    Number(item.salesPrice) * days * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start gap-4"
                    >
                      {/* Thumbnail */}
                      <img
                        src={getProductImageUrl(item.imageUrl)}
                        alt={item.name}
                        className="h-24 w-24 shrink-0 rounded-2xl object-cover bg-surface border border-border"
                      />

                      {/* Main Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                              {item.categoryName}
                            </span>
                            <h3 className="font-display text-base font-bold text-text">
                              {item.name}
                            </h3>
                            <p className="text-xs text-chalk mt-0.5">
                              Provided by: <strong className="text-text font-medium">{item.vendorName}</strong>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="rounded-lg p-1.5 text-chalk hover:text-danger hover:bg-danger/10 transition"
                            title="Remove from cart"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Date Picker Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-surface/60 p-3 border border-border/80">
                          <div>
                            <label className="block text-[11px] font-semibold text-chalk mb-1">
                              Rental Start Date
                            </label>
                            <input
                              type="date"
                              required
                              value={item.rentalStart}
                              min={new Date().toISOString().slice(0, 10)}
                              onChange={(e) =>
                                updateDates(item.id, e.target.value, item.rentalEnd)
                              }
                              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-chalk mb-1">
                              Return Date ({days} Days)
                            </label>
                            <input
                              type="date"
                              required
                              value={item.rentalEnd}
                              min={item.rentalStart}
                              onChange={(e) =>
                                updateDates(item.id, item.rentalStart, e.target.value)
                              }
                              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Quantity & Item Subtotal Row */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-chalk">Quantity:</span>
                            <div className="flex items-center rounded-lg border border-border bg-surface px-1 py-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                disabled={item.quantity <= 1}
                                className="px-2 py-0.5 text-xs font-bold text-text disabled:opacity-30"
                              >
                                -
                              </button>
                              <span className="px-2 text-xs font-semibold text-text">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                disabled={item.quantity >= item.quantityOnHand}
                                className="px-2 py-0.5 text-xs font-bold text-text disabled:opacity-30"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[11px] text-chalk">
                              ({item.quantityOnHand} available)
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="font-display text-sm font-bold text-text">
                              {formatPrice(itemEstimatedTotal)}
                            </div>
                            <div className="text-[11px] text-chalk">
                              Deposit: {formatPrice(Number(item.securityDeposit) * item.quantity)}
                            </div>
                          </div>
                        </div>

                        {idx === 0 && items.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              applyDatesToAll(item.rentalStart, item.rentalEnd)
                            }
                            className="text-[11px] text-accent hover:underline flex items-center gap-1 font-semibold"
                          >
                            <CalendarDays size={12} />
                            Apply these dates to all {items.length} items
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* 2. FULFILLMENT & SHIPPING DETAILS */}
            <Panel className="p-6">
              <div className="flex items-center gap-2.5 border-b border-border pb-4 mb-5">
                <div className="rounded-xl bg-accent/15 p-2 text-accent">
                  <Truck size={18} />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-text">
                    2. Fulfillment & Delivery Details
                  </h2>
                  <p className="text-xs text-chalk">
                    Choose doorstep delivery or pick up directly from the store
                  </p>
                </div>
              </div>

              {/* Delivery vs Store Pickup Radio Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod("HOME_DELIVERY")}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    fulfillmentMethod === "HOME_DELIVERY"
                      ? "border-accent bg-accent/10 text-text"
                      : "border-border bg-surface hover:border-border/90 text-chalk"
                  }`}
                >
                  <div className="rounded-xl bg-accent/20 p-2 text-accent mt-0.5">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-text">
                      Home / Site Delivery
                    </h3>
                    <p className="text-xs text-chalk mt-0.5">
                      Equipment dispatched directly to your specified address.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentMethod("STORE_PICKUP")}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    fulfillmentMethod === "STORE_PICKUP"
                      ? "border-accent bg-accent/10 text-text"
                      : "border-border bg-surface hover:border-border/90 text-chalk"
                  }`}
                >
                  <div className="rounded-xl bg-accent/20 p-2 text-accent mt-0.5">
                    <Store size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-text">
                      Store Collection
                    </h3>
                    <p className="text-xs text-chalk mt-0.5">
                      Pick up directly from the partner store or warehouse hub.
                    </p>
                  </div>
                </button>
              </div>

              {/* Delivery Address Fields */}
              {fulfillmentMethod === "HOME_DELIVERY" ? (
                <div className="space-y-4 rounded-2xl bg-surface/60 p-4 border border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                      <MapPin size={14} className="text-accent" />
                      Shipping Address
                    </label>
                    {savedAddresses.length > 0 && (
                      <span className="text-[11px] text-chalk">
                        Saved address auto-filled
                      </span>
                    )}
                  </div>

                  {savedAddresses.length > 1 && (
                    <div>
                      <label className="block text-[11px] text-chalk mb-1">
                        Select from saved addresses:
                      </label>
                      <select
                        onChange={(e) => setAddressLine1(e.target.value)}
                        value={addressLine1}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
                      >
                        {savedAddresses.map((addr, i) => (
                          <option key={i} value={addr}>
                            {addr}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Input
                    id="delivery-line1"
                    label="Street Address Line 1"
                    placeholder="e.g. 402, High Street Towers, Indiranagar"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  />

                  <Input
                    id="delivery-line2"
                    label="Apartment, Landmark, or Suite (Optional)"
                    placeholder="e.g. Near Metro Station Gate 2"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Input
                      id="delivery-city"
                      label="City"
                      placeholder="e.g. Bengaluru"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                    <Input
                      id="delivery-state"
                      label="State"
                      placeholder="e.g. Karnataka"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                    <Input
                      id="delivery-postal"
                      label="Postal Code"
                      placeholder="e.g. 560038"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-surface/60 p-5 border border-border space-y-3">
                  <div className="flex items-start gap-3">
                    <Store size={20} className="text-accent mt-0.5" />
                    <div>
                      <h4 className="font-display text-sm font-bold text-text">
                        FlexRent Verified Store & Hub Pickup
                      </h4>
                      <p className="text-xs text-chalk mt-1 leading-relaxed">
                        Collect your reserved equipment from the partner vendor's store.
                        You will receive an instant notification & timeline tracking
                        when the gear is inspected and packed for pickup.
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-chalk">
                        <Clock size={14} className="text-accent" />
                        <span>Standard store pickup timings: 09:00 AM – 08:00 PM</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Panel>

            {/* 3. PAYMENT METHOD & SECURITY DEPOSIT */}
            <Panel className="p-6">
              <div className="flex items-center gap-2.5 border-b border-border pb-4 mb-5">
                <div className="rounded-xl bg-accent/15 p-2 text-accent">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-text">
                    3. Payment Information & Security Deposit
                  </h2>
                  <p className="text-xs text-chalk">
                    Select payment preference. Security deposit is held securely and refunded upon timely return.
                  </p>
                </div>
              </div>

              {/* Payment Methods Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
                    paymentMethod === "UPI"
                      ? "border-accent bg-accent/10 text-accent font-bold"
                      : "border-border bg-surface text-chalk hover:border-border/90"
                  }`}
                >
                  <QrCode size={24} className="mb-2" />
                  <span className="text-xs">UPI / QR Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
                    paymentMethod === "CARD"
                      ? "border-accent bg-accent/10 text-accent font-bold"
                      : "border-border bg-surface text-chalk hover:border-border/90"
                  }`}
                >
                  <CreditCard size={24} className="mb-2" />
                  <span className="text-xs">Credit / Debit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
                    paymentMethod === "CASH"
                      ? "border-accent bg-accent/10 text-accent font-bold"
                      : "border-border bg-surface text-chalk hover:border-border/90"
                  }`}
                >
                  <Banknote size={24} className="mb-2" />
                  <span className="text-xs">Pay on Handover</span>
                </button>
              </div>

              {/* UPI / Card details */}
              {paymentMethod === "UPI" && (
                <div className="rounded-2xl bg-surface/60 p-4 border border-border space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text">
                    <QrCode size={16} className="text-accent" />
                    <span>UPI Reference / UTR Details (Optional at checkout)</span>
                  </div>
                  <Input
                    id="upi-txn"
                    label="Transaction ID / UTR Number"
                    placeholder="e.g. 123456789012 (if already transferred)"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                  <p className="text-[11px] text-chalk">
                    You can also pay after quotation confirmation using the Dynamic QR code on the order page.
                  </p>
                </div>
              )}

              {/* Security Deposit Explainer */}
              <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 flex items-start gap-3">
                <ShieldCheck size={20} className="text-green-500 shrink-0 mt-0.5" />
                <div className="text-xs text-text leading-relaxed">
                  <strong className="text-green-400 font-bold block mb-0.5">
                    100% Refundable Security Deposit Policy
                  </strong>
                  The security deposit of <span className="font-bold font-mono">{formatPrice(depositDisplay)}</span> is held as a protective guarantee.
                  Upon on-time return of the equipment in good working condition, the entire deposit is automatically refunded back to your account.
                </div>
              </div>

              {/* Optional Notes */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-chalk mb-1">
                  Delivery / Order Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Special instructions for the vendor or courier..."
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-text focus:border-accent focus:outline-none"
                />
              </div>
            </Panel>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary & Action */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <Panel className="p-6 border-accent/30 shadow-xl">
                <h3 className="font-display text-base font-bold text-text border-b border-border pb-3 flex items-center justify-between">
                  <span>Order Summary</span>
                  {isPreviewLoading && (
                    <RefreshCw size={14} className="animate-spin text-accent" />
                  )}
                </h3>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex justify-between text-chalk">
                    <span>Total Rental Items</span>
                    <span className="font-semibold text-text">{itemCount} units</span>
                  </div>

                  <div className="flex justify-between text-chalk">
                    <span>Rental Subtotal</span>
                    <span className="font-mono text-text">
                      {formatPrice(subtotalDisplay)}
                    </span>
                  </div>

                  <div className="flex justify-between text-chalk">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={13} className="text-green-500" />
                      Refundable Deposit
                    </span>
                    <span className="font-mono text-green-400 font-medium">
                      + {formatPrice(depositDisplay)}
                    </span>
                  </div>

                  <div className="flex justify-between text-chalk">
                    <span>Delivery / Handling</span>
                    <span className="font-mono text-text">
                      {fulfillmentMethod === "HOME_DELIVERY" ? "Free" : "Store Pickup"}
                    </span>
                  </div>

                  <div className="border-t border-border pt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-bold text-text block">
                        Total Payable
                      </span>
                      <span className="text-[10px] text-chalk">
                        (Incl. refundable deposit)
                      </span>
                    </div>
                    <span className="font-display text-xl font-bold text-accent">
                      {formatPrice(grandTotalDisplay)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting || items.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-lg shadow-accent/20"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Placing Rental Order...</span>
                      </>
                    ) : (
                      <>
                        <span>Place Rental Order</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-[11px] text-chalk">
                    Instant quotation generated. Invoices downloadable after confirmation.
                  </p>
                </div>
              </Panel>

              {/* Vendor Breakdown Card */}
              {preview?.vendorGroups && preview.vendorGroups.length > 1 && (
                <Panel className="p-4 bg-surface/50 text-xs space-y-2 border-dashed">
                  <div className="flex items-center gap-1.5 font-semibold text-text">
                    <AlertCircle size={14} className="text-accent" />
                    <span>Multi-Vendor Cart Notice</span>
                  </div>
                  <p className="text-chalk leading-relaxed text-[11px]">
                    Your cart contains items from {preview.vendorGroups.length} different
                    vendors. We will automatically split your checkout into separate
                    coordinated orders for each vendor.
                  </p>
                </Panel>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
