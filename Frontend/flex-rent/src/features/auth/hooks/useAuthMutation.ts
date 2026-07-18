"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function useLogin() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const mutate = async (data: LoginInput) => {
    setPending(true);
    try {
      const response = await login(data);
      localStorage.setItem("access_token", response.accessToken);
      router.push("/dashboard");
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
      const response = await signup(data);
      localStorage.setItem("access_token", response.accessToken);
      router.push("/dashboard");
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
      const response = await vendorSignup(data);
      localStorage.setItem("access_token", response.accessToken);
      router.push("/dashboard");
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
