import api from "@/core/api";
import type { Category } from "@/features/products/api";

export async function listCategoriesLive() {
  const response = await api.get("/categories", { params: { limit: 100, sortBy: "name", sortOrder: "asc" } });
  return response.data.data.categories as Category[];
}

export async function createCategory(input: { name: string; description?: string }) {
  const response = await api.post("/categories", input);
  return response.data.data.category as Category;
}

export async function updateCategory(id: string, input: { name?: string; description?: string | null }) {
  const response = await api.put(`/categories/${id}`, input);
  return response.data.data.category as Category;
}

export async function deleteCategory(id: string) {
  const response = await api.delete(`/categories/${id}`);
  return response.data.data.category as Category;
}
