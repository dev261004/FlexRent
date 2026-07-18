import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { productAttributeService } from "../services/product-attribute.service";
import {
  createProductAttributeSchema,
  listProductAttributesQuerySchema,
  productAttributeParamsSchema,
  updateProductAttributeSchema,
} from "../validations/product-attribute.validation";

export const createProductAttribute = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = createProductAttributeSchema.parse(req.body);
    const attribute = await productAttributeService.createAttribute(payload);

    res.status(201).json({
      success: true,
      message: "Product attribute created successfully",
      data: { attribute },
    });
  }
);

export const listProductAttributes = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listProductAttributesQuerySchema.parse(req.query);
    const result = await productAttributeService.getAttributes(query);

    res.json({
      success: true,
      message: "Product attributes fetched successfully",
      data: result,
    });
  }
);

export const getProductAttributeById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = productAttributeParamsSchema.parse(req.params);
    const attribute = await productAttributeService.getAttributeById(id);

    res.json({
      success: true,
      message: "Product attribute fetched successfully",
      data: { attribute },
    });
  }
);

export const updateProductAttribute = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = productAttributeParamsSchema.parse(req.params);
    const payload = updateProductAttributeSchema.parse(req.body);
    const attribute = await productAttributeService.updateAttribute(id, payload);

    res.json({
      success: true,
      message: "Product attribute updated successfully",
      data: { attribute },
    });
  }
);

export const deleteProductAttribute = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = productAttributeParamsSchema.parse(req.params);
    const attribute = await productAttributeService.deleteAttribute(id);

    res.json({
      success: true,
      message: "Product attribute deleted successfully",
      data: { attribute },
    });
  }
);
