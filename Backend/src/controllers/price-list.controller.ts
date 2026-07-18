import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { priceListService } from "../services/price-list.service";
import {
  createPriceListSchema,
  listPriceListsQuerySchema,
  priceListParamsSchema,
  updatePriceListSchema,
} from "../validations/price-list.validation";

export const createPriceList = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = createPriceListSchema.parse(req.body);
    const priceList = await priceListService.createPriceList(payload);

    res.status(201).json({
      success: true,
      message: "Price list created successfully",
      data: { priceList },
    });
  }
);

export const getPriceLists = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listPriceListsQuerySchema.parse(req.query);
    const result = await priceListService.getPriceLists(query);

    res.json({
      success: true,
      message: "Price lists fetched successfully",
      data: result,
    });
  }
);

export const getPriceList = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = priceListParamsSchema.parse(req.params);
    const priceList = await priceListService.getPriceList(id);

    res.json({
      success: true,
      message: "Price list fetched successfully",
      data: { priceList },
    });
  }
);

export const updatePriceList = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = priceListParamsSchema.parse(req.params);
    const payload = updatePriceListSchema.parse(req.body);
    const priceList = await priceListService.updatePriceList(id, payload);

    res.json({
      success: true,
      message: "Price list updated successfully",
      data: { priceList },
    });
  }
);

export const deletePriceList = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = priceListParamsSchema.parse(req.params);
    const priceList = await priceListService.deletePriceList(id);

    res.json({
      success: true,
      message: "Price list deleted successfully",
      data: { priceList },
    });
  }
);
