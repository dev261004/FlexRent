import api from "@/core/api";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type ProductType = "GOODS" | "SERVICE";

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  type: ProductType;
  status: ProductStatus;
  quantityOnHand: number;
  salesPrice: string;
  costPrice: string | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  vendor: { id: string; fullName?: string; companyName?: string | null } | null;
  primaryImage: ProductImage | null;
  images?: ProductImage[];
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
};

export type ProductPayload = {
  name: string;
  sku?: string | null;
  description?: string | null;
  type: ProductType;
  status: ProductStatus;
  quantityOnHand: number;
  salesPrice: number;
  costPrice?: number | null;
  categoryId?: string | null;
};

export async function listProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
}) {
  const response = await api.get("/products", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search || undefined,
      status: params.status || undefined,
      sortBy: "createdAt",
      order: "desc",
    },
  });

  return response.data.data as {
    products: Product[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

export async function getProduct(id: string) {
  const response = await api.get(`/products/${id}`);
  return response.data.data.product as Product;
}

export async function createProduct(payload: ProductPayload) {
  const response = await api.post("/products", cleanPayload(payload));
  return response.data.data.product as Product;
}

export async function updateProduct(id: string, payload: ProductPayload) {
  const response = await api.put(`/products/${id}`, cleanPayload(payload));
  return response.data.data.product as Product;
}

export async function archiveProduct(id: string) {
  const response = await api.delete(`/products/${id}`);
  return response.data.data.product as Product;
}

export async function listCategories() {
  const response = await api.get("/categories", {
    params: { limit: 100, sortBy: "name", sortOrder: "asc" },
  });
  return response.data.data.categories as Category[];
}

export async function uploadProductImages(productId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const response = await api.post(`/products/${productId}/images`, formData);

  return response.data.data.images as ProductImage[];
}

export async function listProductImages(productId: string) {
  const response = await api.get(`/products/${productId}/images`);
  return response.data.data.images as ProductImage[];
}

export async function setPrimaryProductImage(imageId: string) {
  const response = await api.patch(`/products/images/${imageId}/primary`);
  return response.data.data.image as ProductImage;
}

export async function deleteProductImage(imageId: string) {
  const response = await api.delete(`/products/images/${imageId}`);
  return response.data.data.image as ProductImage;
}

function cleanPayload(payload: ProductPayload) {
  return {
    ...payload,
    sku: payload.sku?.trim() || undefined,
    description: payload.description?.trim() || undefined,
    categoryId: payload.categoryId || undefined,
    costPrice: payload.costPrice ?? undefined,
  };
}
