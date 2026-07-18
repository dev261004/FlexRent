"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/components/admin/ThemeProvider";

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme, ready } = useTheme();

  if (!ready) {
    return (
      <div className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
    );
  }

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  if (compact) {
    return (
      <div className="space-y-2 px-3">
        <p className="text-xs font-medium text-chalk">Theme</p>
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                theme === value
                  ? "bg-accent text-black"
                  : "text-chalk hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-text">Theme</p>
        <p className="text-xs text-chalk">
          {theme === "dark" ? "Dark mode" : "Light mode"} is active
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
              theme === value
                ? "border-accent bg-accent text-black"
                : "border-border bg-surface text-chalk hover:border-accent/40 hover:text-text"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
