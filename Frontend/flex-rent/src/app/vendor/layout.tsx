"use client";

import { Bell, Search } from "lucide-react";
import { VendorSidebar } from "@/components/vendor/VendorSidebar";

export default function VendorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-surface">
      <VendorSidebar />
      <main className="min-h-screen pt-14 md:pl-[280px] md:pt-0">
        <div className="sticky top-0 z-10 hidden h-[76px] items-center justify-between border-b border-border/80 bg-surface/90 px-8 backdrop-blur md:flex">
          <div className="relative w-full max-w-sm">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-chalk" />
            <input aria-label="Search vendor workspace" placeholder="Search products, orders, customers..." className="w-full rounded-xl border border-border bg-surface-raised py-2.5 pl-10 pr-4 text-sm text-text outline-none transition placeholder:text-chalk/70 focus:border-accent/70 focus:ring-2 focus:ring-accent/15" />
          </div>
          <div className="ml-6 flex items-center gap-4">
            <button type="button" aria-label="View notifications" className="relative rounded-xl border border-border bg-surface-raised p-2.5 text-chalk transition hover:border-accent/40 hover:text-text"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" /></button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-black">VR</div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
