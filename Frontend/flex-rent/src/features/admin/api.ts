import api from "@/core/api";
import type {
  QuotationTemplate,
  CreateQuotationTemplateInput,
  UpdateQuotationTemplateInput,
  ListQuotationTemplatesParams,
  AdminUser,
  AdminRentalPeriod,
  RentalOperationsDashboardData,
} from "./types";

export interface QuotationTemplatesResponse {
  quotationTemplates: QuotationTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------- Quotation Templates ----------------
export async function getQuotationTemplates(
  params?: ListQuotationTemplatesParams
): Promise<QuotationTemplatesResponse> {
  const response = await api.get("/quotation-templates", { params });
  return response.data.data;
}

export async function getQuotationTemplate(id: string): Promise<QuotationTemplate> {
  const response = await api.get(`/quotation-templates/${id}`);
  return response.data.data.quotationTemplate;
}

export async function getDefaultQuotationTemplate(): Promise<QuotationTemplate | null> {
  const response = await api.get("/quotation-templates/default");
  return response.data.data.quotationTemplate;
}

export async function createQuotationTemplate(
  data: CreateQuotationTemplateInput
): Promise<QuotationTemplate> {
  const response = await api.post("/quotation-templates", data);
  return response.data.data.quotationTemplate;
}

export async function updateQuotationTemplate(
  id: string,
  data: UpdateQuotationTemplateInput
): Promise<QuotationTemplate> {
  const response = await api.patch(`/quotation-templates/${id}`, data);
  return response.data.data.quotationTemplate;
}

export async function deleteQuotationTemplate(id: string): Promise<QuotationTemplate> {
  const response = await api.delete(`/quotation-templates/${id}`);
  return response.data.data.quotationTemplate;
}

export async function setDefaultQuotationTemplate(id: string): Promise<QuotationTemplate> {
  const response = await api.post(`/quotation-templates/${id}/default`);
  return response.data.data.quotationTemplate;
}

// ---------------- Dashboard ----------------
export async function getRentalOperationsDashboard(
  range: string = "today",
  vendorId?: string
): Promise<RentalOperationsDashboardData> {
  const response = await api.get("/dashboard/rental-operations", {
    params: { range, vendorId },
  });
  return response.data.data.dashboard;
}

// ---------------- Users Management ----------------
export interface UsersListResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<UsersListResponse> {
  const response = await api.get("/users", { params });
  return response.data.data;
}

export async function getUser(id: string): Promise<AdminUser> {
  const response = await api.get(`/users/${id}`);
  return response.data.data.user;
}

export async function createUser(data: {
  email: string;
  password?: string;
  firstName: string;
  lastName?: string;
  role?: string;
  status?: string;
  phone?: string;
  companyName?: string;
}): Promise<AdminUser> {
  const response = await api.post("/users", {
    ...data,
    password: data.password || "Password123!",
  });
  return response.data.data.user;
}

export async function updateUser(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    role?: string;
    status?: string;
    phone?: string;
    companyName?: string;
    password?: string;
  }
): Promise<AdminUser> {
  const response = await api.patch(`/users/${id}`, data);
  return response.data.data.user;
}

export async function deleteUser(id: string): Promise<AdminUser> {
  const response = await api.delete(`/users/${id}`);
  return response.data.data.user;
}

// ---------------- Rental Periods ----------------
export async function getRentalPeriods(
  includeInactive = false
): Promise<AdminRentalPeriod[]> {
  const response = await api.get("/rental-periods", {
    params: { includeInactive: includeInactive ? "true" : undefined },
  });
  return response.data.data.rentalPeriods;
}

export async function getRentalPeriod(id: string): Promise<AdminRentalPeriod> {
  const response = await api.get(`/rental-periods/${id}`);
  return response.data.data.rentalPeriod;
}

export async function createRentalPeriod(data: {
  name: string;
  unit: "HOUR" | "DAY" | "NIGHT" | "WEEK" | "MONTH";
  duration: number;
  isDefault?: boolean;
  isActive?: boolean;
}): Promise<AdminRentalPeriod> {
  const response = await api.post("/rental-periods", data);
  return response.data.data.rentalPeriod;
}

export async function updateRentalPeriod(
  id: string,
  data: Partial<AdminRentalPeriod>
): Promise<AdminRentalPeriod> {
  const response = await api.patch(`/rental-periods/${id}`, data);
  return response.data.data.rentalPeriod;
}

export async function deleteRentalPeriod(id: string): Promise<AdminRentalPeriod> {
  const response = await api.delete(`/rental-periods/${id}`);
  return response.data.data.rentalPeriod;
}
