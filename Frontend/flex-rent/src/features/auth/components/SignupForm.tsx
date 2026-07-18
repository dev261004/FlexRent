"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSignup } from "../hooks/useAuthMutation";
import { signupSchema, type SignupInput } from "../validation/authSchemas";
import { checkEmail } from "../services/authApi";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function SignupForm() {
  const { mutate, pending } = useSignup();
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, dirtyFields },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const email = watch("email");
  const debouncedEmail = useDebounce(email, 500);
  const isEmailDirty = dirtyFields.email;

  useEffect(() => {
    if (!debouncedEmail || !isEmailDirty) return;
    if (errors.email) return;

    let cancelled = false;
    setEmailStatus("checking");
    setEmailError(null);

    checkEmail(debouncedEmail)
      .then((res) => {
        if (cancelled) return;
        if (!res.available) {
          setEmailStatus("unavailable");
          setEmailError("This email is already registered");
          setError("email", { message: "This email is already registered" });
        } else {
          setEmailStatus("available");
          clearErrors("email");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setEmailStatus("idle");
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedEmail, isEmailDirty, errors.email, setError, clearErrors]);

  const onSubmit = async (data: SignupInput) => {
    try {
      await mutate(data);
    } catch {
      setError("root", {
        message: "Signup failed. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex gap-3">
        <Input
          id="firstName"
          type="text"
          placeholder="First name"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <Input
          id="lastName"
          type="text"
          placeholder="Last name"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register("lastName")}
        />
      </div>
      <div className="relative">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="Email address"
          error={errors.email?.message}
          {...register("email")}
        />
        {(emailStatus === "checking" || emailStatus === "available") &&
          isEmailDirty &&
          !errors.email && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {emailStatus === "checking" ? (
                <svg
                  className="h-4 w-4 animate-spin text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
          )}
      </div>
      <Input
        id="password"
        type="password"
        autoComplete="new-password"
        placeholder="Password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        id="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Confirm password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Input
        id="couponCode"
        type="text"
        placeholder="Coupon code (optional)"
        error={errors.couponCode?.message}
        {...register("couponCode")}
      />
      {errors.root && (
        <p className="text-sm text-red-400">{errors.root.message}</p>
      )}
      <Button type="submit" pending={pending}>
        Create Account
      </Button>
      <p className="text-center text-sm text-chalk">
        Registering as a vendor?{" "}
        <Link
          href="/vendor-signup"
          className="underline underline-offset-2 hover:text-text"
        >
          Create a business account
        </Link>
      </p>
    </form>
  );
}
