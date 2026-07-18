import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  pending?: boolean;
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-accent text-black hover:bg-yellow-400 disabled:bg-accent/50 disabled:text-black/50",
  secondary:
    "border border-white/10 text-text hover:bg-white/5 disabled:border-white/5 disabled:text-chalk",
  ghost: "text-chalk hover:text-text disabled:text-chalk/50",
};

export function Button({
  variant = "primary",
  pending = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variantStyles[variant]} ${className ?? ""}`}
      disabled={disabled || pending}
      {...props}
    >
      {pending ? "Loading..." : children}
    </button>
  );
}
