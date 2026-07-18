import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { priceListRuleService } from "../services/price-list-rule.service";
import {
  createPriceListRuleSchema,
  listPriceListRulesQuerySchema,
  priceListRuleListParamsSchema,
  priceListRuleParamsSchema,
  updatePriceListRuleSchema,
} from "../validations/price-list-rule.validation";

export const createPriceListRule = asyncHandler(
  async (req: Request, res: Response) => {
    const { priceListId } = priceListRuleListParamsSchema.parse(req.params);
    const payload = createPriceListRuleSchema.parse(req.body);
    const rule = await priceListRuleService.createRule(
      priceListId,
      payload,
      req.user!
    );

    res.status(201).json({
      success: true,
      message: "Price list rule created successfully",
      data: { rule },
    });
  }
);

export const getPriceListRules = asyncHandler(
  async (req: Request, res: Response) => {
    const { priceListId } = priceListRuleListParamsSchema.parse(req.params);
    const query = listPriceListRulesQuerySchema.parse(req.query);
    const result = await priceListRuleService.getRules(priceListId, query);

    res.json({
      success: true,
      message: "Price list rules fetched successfully",
      data: result,
    });
  }
);

export const getPriceListRule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = priceListRuleParamsSchema.parse(req.params);
    const rule = await priceListRuleService.getRule(id);

    res.json({
      success: true,
      message: "Price list rule fetched successfully",
      data: { rule },
    });
  }
);

export const updatePriceListRule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = priceListRuleParamsSchema.parse(req.params);
    const payload = updatePriceListRuleSchema.parse(req.body);
    const rule = await priceListRuleService.updateRule(id, payload, req.user!);

    res.json({
      success: true,
      message: "Price list rule updated successfully",
      data: { rule },
    });
  }
);

export const deletePriceListRule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = priceListRuleParamsSchema.parse(req.params);
    const rule = await priceListRuleService.deleteRule(id, req.user!);

    res.json({
      success: true,
      message: "Price list rule deleted successfully",
      data: { rule },
    });
  }
);
