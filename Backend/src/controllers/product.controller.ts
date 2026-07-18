import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { productService } from "../services/product.service";
import {
  createProductSchema,
  listProductsQuerySchema,
  productParamsSchema,
  updateProductSchema,
} from "../validations/product.validation";

const getAuthenticatedUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, "Authentication is required");
  }

  return req.user;
};

export const listProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const query = listProductsQuerySchema.parse(req.query);
    const result = await productService.listProducts(query, user);

    res.json({
      success: true,
      message: "Products fetched successfully",
      data: result,
    });
  }
);

export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = productParamsSchema.parse(req.params);
    const product = await productService.getProductById(id, user);

    res.json({
      success: true,
      message: "Product fetched successfully",
      data: { product },
    });
  }
);

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const payload = createProductSchema.parse(req.body);
    const product = await productService.createProduct(payload, user);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { product },
    });
  }
);

export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = productParamsSchema.parse(req.params);
    const payload = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(id, payload, user);

    res.json({
      success: true,
      message: "Product updated successfully",
      data: { product },
    });
  }
);

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = productParamsSchema.parse(req.params);
    const product = await productService.deleteProduct(id, user);

    res.json({
      success: true,
      message: "Product archived successfully",
      data: { product },
    });
  }
);
