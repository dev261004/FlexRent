import { z } from "zod";
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
} from "../validations/product.validation";
import { AuthRequestUser } from "./auth.types";

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export type ProductRequester = AuthRequestUser;

export type ProductPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedProducts<TProduct> = {
  products: TProduct[];
  pagination: ProductPagination;
};
