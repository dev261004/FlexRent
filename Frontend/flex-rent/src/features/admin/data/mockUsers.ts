import type { AdminUser } from "../types";

export const MOCK_USERS: AdminUser[] = [
  {
    id: "u1",
    name: "John Doe",
    email: "john@example.com",
    role: "customer",
    status: "active",
  },
  {
    id: "u2",
    name: "Alice Sharma",
    email: "alice@example.com",
    role: "customer",
    status: "active",
  },
  {
    id: "u3",
    name: "Raj Equipment Co.",
    email: "raj@vendors.flexrent",
    role: "vendor",
    status: "active",
  },
  {
    id: "u4",
    name: "Emma Wilson",
    email: "emma@example.com",
    role: "customer",
    status: "inactive",
  },
  {
    id: "u5",
    name: "GearHub Rentals",
    email: "ops@gearhub.com",
    role: "vendor",
    status: "active",
  },
];
