"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useVendorSignup } from "../hooks/useAuthMutation";
import {
  vendorSignupSchema,
  type VendorSignupInput,
} from "../validation/authSchemas";
import { PRODUCT_CATEGORIES } from "../data/productCategories";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";

export function VendorSignupForm() {
  const { mutate, pending } = useVendorSignup();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<VendorSignupInput>({
    resolver: zodResolver(vendorSignupSchema),
  });

  const category = watch("productCategory");

  const onSubmit = async (data: VendorSignupInput) => {
    try {
      await mutate(data);
    } catch {
      setError("root", {
        message: "Registration failed. Please try again.",
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
        id="businessName"
        type="text"
        placeholder="Company name"
        error={errors.businessName?.message}
        {...register("businessName")}
      />
      <Input
        id="gstNo"
        type="text"
        placeholder="GST number"
        error={errors.gstNo?.message}
        {...register("gstNo")}
      />
      <Combobox
        label="Product Category"
        options={[...PRODUCT_CATEGORIES]}
        value={category ?? ""}
        onChange={(val) =>
          setValue("productCategory", val, { shouldValidate: true })
        }
        placeholder="Search categories..."
        error={errors.productCategory?.message}
      />
      {errors.root && (
        <p className="text-sm text-red-400">{errors.root.message}</p>
      )}
      <Button type="submit" pending={pending}>
        Create Business Account
      </Button>
    </form>
  );
}
