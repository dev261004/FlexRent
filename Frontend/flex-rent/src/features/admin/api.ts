import api from "@/core/api";
import type {
  QuotationTemplate,
  CreateQuotationTemplateInput,
  UpdateQuotationTemplateInput,
  ListQuotationTemplatesParams,
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
