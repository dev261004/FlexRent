"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sun, Moon } from "lucide-react";
import { VendorSidebar } from "@/components/vendor/VendorSidebar";
import { useTheme } from "@/components/admin/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { updatePickupSettings } from "@/features/customer/api";
import { X, MapPin } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function VendorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { theme, toggleTheme, ready } = useTheme();
  const { user, login, token, isLoading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role === "CUSTOMER") {
      router.replace("/dashboard");
    } else if (user.role === "ADMIN") {
      router.replace("/admin/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const saved = localStorage.getItem("flexrent_vendor_sidebar_collapsed");
    if (saved) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  const [showPickupPrompt, setShowPickupPrompt] = useState(false);
  const [wantsPickup, setWantsPickup] = useState(false);
  const [address, setAddress] = useState({ line1: "", line2: "", city: "", state: "", zip: "", country: "" });
  const [savingPickup, setSavingPickup] = useState(false);

  useEffect(() => {
    if (
      user?.role === "VENDOR" &&
      !localStorage.getItem("pickupPromptSeen") &&
      !user.supportsStorePickup &&
      (!user.pickupAddresses || user.pickupAddresses.length === 0)
    ) {
      setShowPickupPrompt(true);
    }
  }, [user]);

  const handlePickupSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPickup(true);
    try {
      const res = await updatePickupSettings(wantsPickup, wantsPickup ? [{
        addressLine1: address.line1,
        addressLine2: address.line2 || undefined,
        city: address.city,
        state: address.state,
        postalCode: address.zip,
        country: address.country,
      }] : undefined);
      const pickupUpdated = res.pickupSettings;

      if (token && user) {
        login(token, {
          ...user,
          supportsStorePickup: pickupUpdated.supportsStorePickup,
          pickupAddresses: pickupUpdated.pickupAddresses,
          storeTimings: pickupUpdated.storeTimings,
        });
      }

      localStorage.setItem("pickupPromptSeen", "true");
      setShowPickupPrompt(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPickup(false);
    }
  };

  const closePrompt = () => {
    localStorage.setItem("pickupPromptSeen", "true");
    setShowPickupPrompt(false);
  };

  const handleSetCollapsed = (val: boolean) => {
    setCollapsed(val);
    localStorage.setItem("flexrent_vendor_sidebar_collapsed", JSON.stringify(val));
  };

  return (
    <div className="min-h-screen bg-surface">
      <VendorSidebar collapsed={collapsed} setCollapsed={handleSetCollapsed} />
      <main className={`min-h-screen pt-14 transition-all duration-300 md:pt-0 ${collapsed ? "md:pl-[76px]" : "md:pl-[280px]"}`}>
        <div className="sticky top-0 z-10 hidden h-[76px] items-center justify-between border-b border-border/80 bg-surface/90 px-8 backdrop-blur md:flex">
          <div className="relative w-full max-w-sm">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-chalk" />
            <input aria-label="Search vendor workspace" placeholder="Search products, orders, customers..." className="w-full rounded-xl border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm text-text outline-none transition placeholder:text-chalk/70 focus:border-accent/70 focus:ring-2 focus:ring-accent/15" />
          </div>
          <div className="ml-6 flex items-center gap-4">
            {ready && (
              <button
                type="button"
                onClick={toggleTheme}
                className="relative rounded-xl border border-border bg-surface-raised p-2.5 text-chalk transition hover:border-accent/40 hover:text-text"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
            <NotificationBell basePath="/vendor" />
            {user && (
              <Link href="/vendor/profile" className="flex items-center gap-3 border-l border-border pl-4 hover:opacity-80 transition-opacity">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-black">
                  {`${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "VE"}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-text">{user.companyName ?? user.fullName}</p>
                  <p className="text-xs text-chalk">Vendor Partner</p>
                </div>
              </Link>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      {showPickupPrompt && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="mx-auto my-10 max-w-lg rounded-3xl border border-border bg-surface shadow-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-text">Do you have a physical store?</h2>
                <p className="mt-2 text-sm text-chalk">
                  Allow customers to pick up their rentals directly from your store. You can also configure this later in your profile settings.
                </p>
              </div>
              <button onClick={closePrompt} className="rounded-lg p-2 text-chalk hover:bg-black/5">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handlePickupSetup} className="mt-6 space-y-5">
              <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer hover:bg-surface-raised">
                <input 
                  type="checkbox" 
                  checked={wantsPickup}
                  onChange={(e) => setWantsPickup(e.target.checked)}
                  className="mt-1 accent-accent"
                />
                <div>
                  <p className="text-sm font-semibold text-text">Yes, I want to offer Store Pickup</p>
                  <p className="text-xs text-chalk">Customers can collect orders themselves</p>
                </div>
              </label>

              {wantsPickup && (
                <div className="space-y-4 rounded-xl border border-border p-4 bg-surface-raised">
                  <p className="text-sm font-semibold text-text flex items-center gap-2">
                    <MapPin size={16} className="text-accent" /> Store Address
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input required value={address.line1} onChange={e=>setAddress({...address, line1: e.target.value})} placeholder="Address Line 1" className="col-span-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" />
                    <input value={address.line2} onChange={e=>setAddress({...address, line2: e.target.value})} placeholder="Address Line 2 (Optional)" className="col-span-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" />
                    <input required value={address.city} onChange={e=>setAddress({...address, city: e.target.value})} placeholder="City" className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" />
                    <input required value={address.state} onChange={e=>setAddress({...address, state: e.target.value})} placeholder="State" className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" />
                    <input required value={address.zip} onChange={e=>setAddress({...address, zip: e.target.value})} placeholder="Postal Code" className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" />
                    <input required value={address.country} onChange={e=>setAddress({...address, country: e.target.value})} placeholder="Country" className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text" />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={closePrompt} className="rounded-xl px-4 py-2 text-sm font-semibold text-text hover:bg-surface-raised">
                  Maybe Later
                </button>
                <button type="submit" disabled={savingPickup} className="rounded-xl bg-accent px-5 py-2 text-sm font-bold text-[#1a1817] disabled:opacity-50">
                  {savingPickup ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
