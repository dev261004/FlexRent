"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ThemeProvider } from "@/components/admin/ThemeProvider";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-surface">
        <AdminSidebar />
        <main className="min-h-screen pt-14 md:pl-[280px] md:pt-0">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
