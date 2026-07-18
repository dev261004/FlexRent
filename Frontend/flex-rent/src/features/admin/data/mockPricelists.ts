import type { AdminPricelist } from "../types";

export const MOCK_PRICELISTS: AdminPricelist[] = [
  {
    id: "pl1",
    name: "Camera Standard",
    productId: "p1",
    productName: "Canon EOS R6",
    dailyRate: 1200,
    weeklyRate: 7000,
    monthlyRate: 22000,
  },
  {
    id: "pl2",
    name: "Audio Event",
    productId: "p2",
    productName: "DJ Speaker Set",
    dailyRate: 800,
    weeklyRate: 4500,
    monthlyRate: 14000,
  },
  {
    id: "pl3",
    name: "Laptop Pro",
    productId: "p3",
    productName: "MacBook Pro 14\"",
    dailyRate: 900,
    weeklyRate: 5000,
    monthlyRate: 16000,
  },
];
