import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-chalk"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={`w-full rounded-lg border bg-surface-raised px-4 py-3 text-sm text-text placeholder-chalk focus:outline-none focus:ring-1 ${
            error
              ? "border-danger focus:border-danger focus:ring-danger"
              : "border-white/10 focus:border-accent focus:ring-accent"
          } ${className ?? ""}`}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
