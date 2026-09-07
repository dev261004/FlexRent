import { AppError } from "../middleware/error.middleware";
import {
  quotationTemplateRepository,
  QuotationTemplateRecord,
} from "../repositories/quotation-template.repository";
import { ProductRequester } from "../types/product.types";
import {
  CreateQuotationTemplateInput,
  ListQuotationTemplatesQuery,
  UpdateQuotationTemplateInput,
} from "../validations/quotation-template.validation";

export class QuotationTemplateService {
  async createTemplate(
    payload: CreateQuotationTemplateInput,
    _user: ProductRequester
  ) {
    const existing = await quotationTemplateRepository.getTemplateByName(
      payload.name
    );
    if (existing) {
      throw new AppError(409, `Quotation template with name "${payload.name}" already exists`);
    }

    const template = await quotationTemplateRepository.createTemplate({
      name: payload.name,
      header: payload.header,
      footer: payload.footer,
      isDefault: payload.isDefault,
      isActive: payload.isActive,
      validityDays: payload.validityDays,
    });

    return this.mapTemplate(template);
  }

  async getTemplates(query: ListQuotationTemplatesQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const [templates, total] = await quotationTemplateRepository.getTemplates({
      search: query.search,
      isActive: query.isActive,
      skip,
      take: limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      quotationTemplates: templates.map((t) => this.mapTemplate(t)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getTemplateById(id: string) {
    const template = await quotationTemplateRepository.getTemplateById(id);
    if (!template) {
      throw new AppError(404, "Quotation template not found");
    }
    return this.mapTemplate(template);
  }

  async getDefaultTemplate() {
    const template = await quotationTemplateRepository.getDefaultTemplate();
    if (!template) {
      return null;
    }
    return this.mapTemplate(template);
  }

  async updateTemplate(
    id: string,
    payload: UpdateQuotationTemplateInput,
    _user: ProductRequester
  ) {
    const existing = await quotationTemplateRepository.getTemplateById(id);
    if (!existing) {
      throw new AppError(404, "Quotation template not found");
    }

    if (payload.name && payload.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await quotationTemplateRepository.getTemplateByName(
        payload.name,
        id
      );
      if (duplicate) {
        throw new AppError(409, `Quotation template with name "${payload.name}" already exists`);
      }
    }

    const updated = await quotationTemplateRepository.updateTemplate(id, {
      name: payload.name,
      header: payload.header,
      footer: payload.footer,
      isDefault: payload.isDefault,
      isActive: payload.isActive,
      validityDays: payload.validityDays,
    });

    return this.mapTemplate(updated);
  }

  async deleteTemplate(id: string, _user: ProductRequester) {
    const existing = await quotationTemplateRepository.getTemplateById(id);
    if (!existing) {
      throw new AppError(404, "Quotation template not found");
    }

    const deleted = await quotationTemplateRepository.deleteTemplate(id);

    // If deleted template was default, pick another active template as default
    if (existing.isDefault) {
      const remaining = await quotationTemplateRepository.getTemplates({
        isActive: true,
        skip: 0,
        take: 1,
      });
      if (remaining[0]?.[0]) {
        await quotationTemplateRepository.setDefaultTemplate(remaining[0][0].id);
      }
    }

    return this.mapTemplate(deleted!);
  }

  async setDefaultTemplate(id: string, _user: ProductRequester) {
    const existing = await quotationTemplateRepository.getTemplateById(id);
    if (!existing) {
      throw new AppError(404, "Quotation template not found");
    }

    const updated = await quotationTemplateRepository.setDefaultTemplate(id);
    return this.mapTemplate(updated);
  }

  private mapTemplate(template: QuotationTemplateRecord) {
    return {
      id: template.id,
      name: template.name,
      header: template.header,
      footer: template.footer,
      isDefault: template.isDefault,
      isActive: template.isActive,
      validityDays: template.validityDays,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }
}

export const quotationTemplateService = new QuotationTemplateService();
