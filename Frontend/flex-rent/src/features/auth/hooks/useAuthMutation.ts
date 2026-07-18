"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  login,
  signup,
  vendorSignup,
  resetPassword,
  updatePassword as updatePasswordApi,
} from "../services/authApi";
import type {
  LoginInput,
  SignupInput,
  VendorSignupInput,
  ResetPasswordInput,
  UpdatePasswordInput,
} from "../validation/authSchemas";

function dashboardFor(role: string) {
  const normalizedRole = role.trim().toUpperCase();
  if (normalizedRole === "ADMIN") return "/admin/dashboard";
  if (normalizedRole === "VENDOR") return "/vendor/dashboard";
  return "/dashboard";
}

export function useLogin() {
  const { login: authLogin } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const mutate = async (data: LoginInput) => {
    setPending(true);
    try {
      const response = await login(data);
      authLogin(response.accessToken, response.user);
      router.replace(dashboardFor(response.user.role));
    } finally {
      setPending(false);
    }
  };

  return { mutate, pending };
}

export function useSignup() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const mutate = async (data: SignupInput) => {
    setPending(true);
    try {
      await signup(data);
      router.replace("/login?registered=customer");
    } finally {
      setPending(false);
    }
  };

  return { mutate, pending };
}

export function useVendorSignup() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const mutate = async (data: VendorSignupInput) => {
    setPending(true);
    try {
      await vendorSignup(data);
      router.replace("/login?registered=vendor");
    } finally {
      setPending(false);
    }
  };

  return { mutate, pending };
}

export function useUpdatePassword() {
  const [pending, setPending] = useState(false);

  const mutate = async (token: string, data: UpdatePasswordInput) => {
    setPending(true);
    try {
      const response = await updatePasswordApi(token, data);
      return response;
    } finally {
      setPending(false);
    }
  };

  return { mutate, pending };
}

export function useResetPassword() {
  const [pending, setPending] = useState(false);

  const mutate = async (data: ResetPasswordInput) => {
    setPending(true);
    try {
      const response = await resetPassword(data);
      return response;
    } finally {
      setPending(false);
    }
  };

  return { mutate, pending };
}
