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
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "VENDOR") return "/vendor/dashboard";
  return "/dashboard";
}

function redirectToDashboard(role: string) {
  window.location.href = dashboardFor(role);
}

export function useLogin() {
  const { login: authLogin } = useAuth();
  const [pending, setPending] = useState(false);

  const mutate = async (data: LoginInput) => {
    setPending(true);
    try {
      const response = await login(data);
      authLogin(response.accessToken, response.user);
      redirectToDashboard(response.user.role);
    } finally {
      setPending(false);
    }
  };

  return { mutate, pending };
}

export function useSignup() {
  const { login: authLogin } = useAuth();
  const [pending, setPending] = useState(false);

  const mutate = async (data: SignupInput) => {
    setPending(true);
    try {
      const response = await signup(data);
      authLogin(response.accessToken, response.user);
      redirectToDashboard(response.user.role);
    } finally {
      setPending(false);
    }
  };

  return { mutate, pending };
}

export function useVendorSignup() {
  const { login: authLogin } = useAuth();
  const [pending, setPending] = useState(false);

  const mutate = async (data: VendorSignupInput) => {
    setPending(true);
    try {
      const response = await vendorSignup(data);
      authLogin(response.accessToken, response.user);
      redirectToDashboard(response.user.role);
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
