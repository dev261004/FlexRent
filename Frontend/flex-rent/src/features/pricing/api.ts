import api from "@/core/api";

export type PriceList = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
  ruleCount: number;
};

export type PriceListRule = {
  id: string;
  priceListId: string;
  productId: string | null;
  categoryId: string | null;
  ruleType: "DISCOUNT" | "FIXED_PRICE";
  discountPercent: string | null;
  fixedPrice: string | null;
  minQuantity: number;
  selectable: boolean;
  product?: { id: string; name: string; sku: string | null } | null;
  category?: { id: string; name: string } | null;
};

export async function listPriceLists() {
  const response = await api.get("/price-lists", { params: { limit: 100 } });
  return response.data.data.priceLists as PriceList[];
}

export async function createPriceList(input: Partial<PriceList> & { name: string }) {
  const response = await api.post("/price-lists", input);
  return response.data.data.priceList as PriceList;
}

export async function updatePriceList(id: string, input: Partial<PriceList>) {
  const response = await api.put(`/price-lists/${id}`, input);
  return response.data.data.priceList as PriceList;
}

export async function deletePriceList(id: string) {
  const response = await api.delete(`/price-lists/${id}`);
  return response.data.data.priceList as PriceList;
}

export async function listPriceListRules(priceListId: string) {
  const response = await api.get(`/price-lists/${priceListId}/rules`, { params: { limit: 100 } });
  return response.data.data.rules as PriceListRule[];
}

export async function createPriceListRule(priceListId: string, input: {
  productId?: string | null;
  categoryId?: string | null;
  ruleType: "DISCOUNT" | "FIXED_PRICE";
  discountPercent?: number | null;
  fixedPrice?: number | null;
  minQuantity?: number;
  selectable?: boolean;
}) {
  const response = await api.post(`/price-lists/${priceListId}/rules`, input);
  return response.data.data.rule as PriceListRule;
}

export async function deletePriceListRule(id: string) {
  const response = await api.delete(`/price-list-rules/${id}`);
  return response.data.data.rule as PriceListRule;
}
