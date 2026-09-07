import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { quotationTemplateService } from "../services/quotation-template.service";
import {
  createQuotationTemplateSchema,
  listQuotationTemplatesQuerySchema,
  quotationTemplateParamsSchema,
  updateQuotationTemplateSchema,
} from "../validations/quotation-template.validation";

const getAuthenticatedUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, "Authentication is required");
  }
  return req.user;
};

export const createQuotationTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const payload = createQuotationTemplateSchema.parse(req.body);
    const quotationTemplate = await quotationTemplateService.createTemplate(
      payload,
      user
    );

    res.status(201).json({
      success: true,
      message: "Quotation template created successfully",
      data: { quotationTemplate },
    });
  }
);

export const getQuotationTemplates = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listQuotationTemplatesQuerySchema.parse(req.query);
    const result = await quotationTemplateService.getTemplates(query);

    res.json({
      success: true,
      message: "Quotation templates fetched successfully",
      data: result,
    });
  }
);

export const getQuotationTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = quotationTemplateParamsSchema.parse(req.params);
    const quotationTemplate = await quotationTemplateService.getTemplateById(id);

    res.json({
      success: true,
      message: "Quotation template fetched successfully",
      data: { quotationTemplate },
    });
  }
);

export const getDefaultQuotationTemplate = asyncHandler(
  async (_req: Request, res: Response) => {
    const quotationTemplate = await quotationTemplateService.getDefaultTemplate();

    res.json({
      success: true,
      message: "Default quotation template fetched successfully",
      data: { quotationTemplate },
    });
  }
);

export const updateQuotationTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = quotationTemplateParamsSchema.parse(req.params);
    const payload = updateQuotationTemplateSchema.parse(req.body);
    const quotationTemplate = await quotationTemplateService.updateTemplate(
      id,
      payload,
      user
    );

    res.json({
      success: true,
      message: "Quotation template updated successfully",
      data: { quotationTemplate },
    });
  }
);

export const deleteQuotationTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = quotationTemplateParamsSchema.parse(req.params);
    const quotationTemplate = await quotationTemplateService.deleteTemplate(
      id,
      user
    );

    res.json({
      success: true,
      message: "Quotation template deleted successfully",
      data: { quotationTemplate },
    });
  }
);

export const setDefaultQuotationTemplate = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = quotationTemplateParamsSchema.parse(req.params);
    const quotationTemplate = await quotationTemplateService.setDefaultTemplate(
      id,
      user
    );

    res.json({
      success: true,
      message: "Quotation template set as default successfully",
      data: { quotationTemplate },
    });
  }
);
