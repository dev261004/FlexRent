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
import axios from "axios";

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
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      companyName: "",
      gstNumber: "",
      productCategory: "",
    },
  });

  const category = watch("productCategory");
  const firstNameVal = watch("firstName");
  const lastNameVal = watch("lastName");
  const emailVal = watch("email");
  const passwordVal = watch("password");
  const confirmPasswordVal = watch("confirmPassword");
  const phoneVal = watch("phone");
  const companyNameVal = watch("companyName");
  const gstNumberVal = watch("gstNumber");

  const allFilled = !!(
    firstNameVal &&
    lastNameVal &&
    emailVal &&
    passwordVal &&
    confirmPasswordVal &&
    phoneVal &&
    companyNameVal &&
    gstNumberVal &&
    category
  );

  const onSubmit = async (data: VendorSignupInput) => {
    try {
      await mutate(data);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Registration failed. Please try again.";
      setError("root", { message });
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
      <Input
        id="companyName"
        type="text"
        placeholder="Company name"
        error={errors.companyName?.message}
        {...register("companyName")}
      />
      <Input
        id="gstNumber"
        type="text"
        placeholder="GST number"
        error={errors.gstNumber?.message}
        {...register("gstNumber", {
          onChange: (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
          },
        })}
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
      <Button type="submit" pending={pending} disabled={!allFilled}>
        Create Business Account
      </Button>
    </form>
  );
}
