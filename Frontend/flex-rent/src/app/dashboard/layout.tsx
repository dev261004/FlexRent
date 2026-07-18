"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/admin/ThemeProvider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, ready } = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-surface/90 px-6 py-3 backdrop-blur-sm">
        <Link
          href="/dashboard"
          className="font-display text-lg font-semibold text-text"
        >
          flexrent
        </Link>

        <div className="flex items-center gap-4">
          {ready && (
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-chalk transition-colors hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          {user && (
            <span className="hidden text-sm text-chalk sm:block">
              {user.fullName}
            </span>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-chalk transition-colors hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
