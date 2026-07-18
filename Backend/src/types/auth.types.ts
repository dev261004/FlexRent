import { AppRole, AppUserStatus } from "./roles";

export type PublicUser = {
  id: string;
  email: string;
  role: AppRole;
  status: AppUserStatus;
  firstName: string;
  lastName: string | null;
  fullName: string;
  phone: string | null;
  profileImage: string | null;
  companyName: string | null;
  productCategory: string | null;
  gstNumber: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthRequestUser = {
  id: string;
  email: string;
  role: AppRole;
  status: AppUserStatus;
};

export type AuthResponse = {
  user: PublicUser;
  accessToken: string;
};

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiFailure = {
  success: false;
  message: string;
  errors?: Record<string, string>;
};
