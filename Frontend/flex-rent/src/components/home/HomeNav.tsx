"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const workspaceHref = (role?: string) => {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "VENDOR":
      return "/vendor/dashboard";
    default:
      return "/dashboard";
  }
};

const profileHref = (role?: string) => {
  switch (role) {
    case "ADMIN":
      return "/admin/account";
    case "VENDOR":
      return "/vendor/profile";
    default:
      return "/dashboard/profile";
  }
};

export function HomeNav() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <nav className="h-10 w-36 rounded-md bg-white/5" aria-label="Loading account navigation" />;
  }

  if (user) {
    const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

    return (
      <nav className="flex items-center gap-3">
        <Link href={workspaceHref(user.role)} className="text-sm font-semibold text-chalk transition-colors hover:text-text">
          Dashboard
        </Link>
        <Link
          href={profileHref(user.role)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-black transition hover:bg-yellow-400"
          aria-label="Open profile"
          title={user.fullName}
        >
          {initials || <UserRound size={18} />}
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-4">
      <Link href="/login" className="text-sm text-chalk transition-colors hover:text-text">
        Sign in
      </Link>
      <Link href="/signup" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-yellow-400">
        Get it
      </Link>
    </nav>
  );
}
