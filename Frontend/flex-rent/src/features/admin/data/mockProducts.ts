import type { AdminProduct } from "../types";

export const MOCK_PRODUCTS: AdminProduct[] = [
  {
    id: "p1",
    name: "Canon EOS R6",
    category: "cameras",
    stock: 4,
    deposit: 5000,
    status: "available",
  },
  {
    id: "p2",
    name: "DJ Speaker Set",
    category: "audio",
    stock: 6,
    deposit: 3000,
    status: "rented",
  },
  {
    id: "p3",
    name: "MacBook Pro 14\"",
    category: "electronics",
    stock: 3,
    deposit: 8000,
    status: "available",
  },
  {
    id: "p4",
    name: "Camping Tent 4P",
    category: "camping",
    stock: 12,
    deposit: 1500,
    status: "available",
  },
  {
    id: "p5",
    name: "Power Drill Kit",
    category: "tools",
    stock: 8,
    deposit: 1000,
    status: "maintenance",
  },
];
