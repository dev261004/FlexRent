"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useLogin } from "../hooks/useAuthMutation";
import { loginSchema, type LoginInput } from "../validation/authSchemas";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const { mutate, pending } = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await mutate(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("root", {
          message: "Invalid User ID or Password",
        });
      } else {
        setError("root", {
          message: "An unexpected error occurred. Please try again.",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="email"
        type="email"
        autoComplete="email"
        placeholder="Email address"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        id="password"
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        error={errors.password?.message}
        {...register("password")}
      />
      {errors.root && (
        <p className="text-sm text-red-400">{errors.root.message}</p>
      )}
      <Button type="submit" pending={pending}>
        Sign In
      </Button>
      <p className="text-center text-sm text-chalk">
        <a
          href="/reset-password"
          className="underline underline-offset-2 hover:text-text"
        >
          Forgot password?
        </a>
      </p>
    </form>
  );
}
