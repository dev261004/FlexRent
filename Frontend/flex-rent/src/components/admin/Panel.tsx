import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface-raised ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
