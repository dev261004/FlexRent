"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  updatePasswordSchema,
  type UpdatePasswordInput,
} from "../validation/authSchemas";
import { useUpdatePassword } from "../hooks/useAuthMutation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function UpdatePasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { mutate, pending } = useUpdatePassword();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async (data: UpdatePasswordInput) => {
    try {
      await mutate(token, data);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Password reset failed. The link may be invalid or expired.";
      setError("root", { message });
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
          <svg
            className="h-7 w-7 text-green-400"
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
        </div>
        <h2 className="mb-2 font-display text-xl font-semibold text-text">
          Password Reset Successful
        </h2>
        <p className="text-sm text-chalk">
          Your password has been updated. Redirecting to sign in...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="password"
        type="password"
        autoComplete="new-password"
        placeholder="New password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        id="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Confirm new password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      {errors.root && (
        <p className="text-sm text-red-400">{errors.root.message}</p>
      )}
      <Button type="submit" pending={pending}>
        Reset Password
      </Button>
    </form>
  );
}
