import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <div
      className={`rounded-2xl border border-border/90 bg-surface-raised shadow-[0_10px_30px_rgba(0,0,0,0.08)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
