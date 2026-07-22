"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSignup } from "../hooks/useAuthMutation";
import { signupSchema, type SignupInput } from "../validation/authSchemas";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function SignupForm() {
  const { mutate, pending } = useSignup();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  const firstNameVal = watch("firstName");
  const lastNameVal = watch("lastName");
  const emailVal = watch("email");
  const passwordVal = watch("password");
  const confirmPasswordVal = watch("confirmPassword");
  const phoneVal = watch("phone");

  const allFilled = !!(
    firstNameVal &&
    lastNameVal &&
    emailVal &&
    passwordVal &&
    confirmPasswordVal &&
    phoneVal
  );

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
          {...register("firstName", {
            onChange: (e) => {
              e.target.value = e.target.value.replace(/[^a-zA-Z]/g, "");
            },
          })}
        />
        <Input
          id="lastName"
          type="text"
          placeholder="Last name"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register("lastName", {
            onChange: (e) => {
              e.target.value = e.target.value.replace(/[^a-zA-Z]/g, "");
            },
          })}
        />
      </div>
      <Input
        id="email"
        type="email"
        autoComplete="email"
        placeholder="Email address"
        error={errors.email?.message}
        {...register("email", {
          onChange: (e) => {
            e.target.value = e.target.value.toLowerCase().replace(/\s/g, "");
          },
        })}
      />
      <Input
        id="password"
        type="password"
        autoComplete="new-password"
        placeholder="Password"
        error={errors.password?.message}
        {...register("password", {
          onChange: (e) => {
            e.target.value = e.target.value.replace(/\s/g, "");
          },
        })}
      />
      <Input
        id="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Confirm password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword", {
          onChange: (e) => {
            e.target.value = e.target.value.replace(/\s/g, "");
          },
        })}
      />
      <Input
        id="phone"
        type="tel"
        autoComplete="tel"
        placeholder="Phone number"
        error={errors.phone?.message}
        {...register("phone", {
          onChange: (e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
          },
        })}
      />
      {errors.root && (
        <p className="text-sm text-red-400">{errors.root.message}</p>
      )}
      <Button type="submit" pending={pending} disabled={!allFilled}>
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
