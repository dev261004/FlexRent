import api from "@/core/api";
import type {
  LoginInput,
  SignupInput,
  VendorSignupInput,
  ResetPasswordInput,
} from "../validation/authSchemas";

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "customer" | "vendor";
  };
}

export interface EmailCheckResponse {
  available: boolean;
}

export async function login(data: LoginInput): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", data);
  return response.data;
}

export async function signup(data: SignupInput): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/signup", data);
  return response.data;
}

export async function vendorSignup(
  data: VendorSignupInput
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    "/auth/vendor-signup",
    data
  );
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function checkEmail(
  email: string
): Promise<EmailCheckResponse> {
  const response = await api.post<EmailCheckResponse>("/auth/check-email", {
    email,
  });
  return response.data;
}

export async function resetPassword(
  data: ResetPasswordInput
): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>(
    "/auth/reset-password",
    data
  );
  return response.data;
}
