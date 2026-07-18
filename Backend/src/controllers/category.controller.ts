import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { categoryService } from "../services/category.service";
import {
  categoryParamsSchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from "../validations/category.validation";

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = createCategorySchema.parse(req.body);
    const category = await categoryService.createCategory(payload);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { category },
    });
  }
);

export const getCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listCategoriesQuerySchema.parse(req.query);
    const result = await categoryService.getCategories(query);

    res.json({
      success: true,
      message: "Categories fetched successfully",
      data: result,
    });
  }
);

export const getCategoryById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = categoryParamsSchema.parse(req.params);
    const category = await categoryService.getCategoryById(id);

    res.json({
      success: true,
      message: "Category fetched successfully",
      data: { category },
    });
  }
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = categoryParamsSchema.parse(req.params);
    const payload = updateCategorySchema.parse(req.body);
    const category = await categoryService.updateCategory(id, payload);

    res.json({
      success: true,
      message: "Category updated successfully",
      data: { category },
    });
  }
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = categoryParamsSchema.parse(req.params);
    const category = await categoryService.deleteCategory(id);

    res.json({
      success: true,
      message: "Category deleted successfully",
      data: { category },
    });
  }
);
