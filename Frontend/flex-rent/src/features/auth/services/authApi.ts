import api from "@/core/api";
import type {
  LoginInput,
  SignupInput,
  VendorSignupInput,
  ResetPasswordInput,
  UpdatePasswordInput,
} from "../validation/authSchemas";

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string | null;
    profileImage: string | null;
    companyName?: string | null;
    productCategory?: string | null;
    gstNumber?: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface EmailCheckResponse {
  available: boolean;
}

export async function login(data: LoginInput): Promise<AuthResponse> {
  const response = await api.post("/auth/login", data);
  return response.data.data;
}

export async function signup(data: SignupInput): Promise<AuthResponse> {
  const response = await api.post("/auth/register", data);
  return response.data.data;
}

export async function vendorSignup(
  data: VendorSignupInput
): Promise<AuthResponse> {
  const response = await api.post(
    "/auth/vendor/register",
    data
  );
  return response.data.data;
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

export async function updatePassword(
  token: string,
  data: UpdatePasswordInput
): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>(
    "/auth/reset-password",
    { token, ...data }
  );
  return response.data;
}
