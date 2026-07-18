import type { AdminOperation } from "../types";

export const MOCK_OPERATIONS: AdminOperation[] = [
  {
    id: "op1",
    orderId: "#R1001",
    customer: "John Doe",
    product: "Canon EOS R6",
    scheduledAt: "Today · 10:00 AM",
    status: "scheduled_pickup",
  },
  {
    id: "op2",
    orderId: "#R1002",
    customer: "Alice Sharma",
    product: "DJ Speaker Set",
    scheduledAt: "Today · 12:30 PM",
    status: "scheduled_pickup",
  },
  {
    id: "op3",
    orderId: "#R0998",
    customer: "David Chen",
    product: "MacBook Pro 14\"",
    scheduledAt: "Today · 4:00 PM",
    status: "due_return",
  },
  {
    id: "op4",
    orderId: "#R0995",
    customer: "Emma Wilson",
    product: "Camping Tent 4P",
    scheduledAt: "Yesterday",
    status: "overdue",
  },
  {
    id: "op5",
    orderId: "#R0990",
    customer: "Priya Nair",
    product: "Power Drill Kit",
    scheduledAt: "2 days ago",
    status: "returned",
  },
];
