import api from "@/core/api";

export type Product = {
  id: string; name: string; slug: string; description: string | null; salesPrice: string;
  quantityOnHand: number; category: { id: string; name: string } | null;
  primaryImage: { url: string; altText?: string | null } | null;
  vendor: { id: string; fullName: string; companyName?: string | null } | null;
};

export type RentalOrder = {
  id: string; rentalNumber: string; status: string; paymentStatus: string;
  approvedAt?: string | null;
  rentalStart: string; rentalEnd: string; grandTotal: string; subtotal: string;
  securityDepositAmount: string; vendor?: { fullName?: string; companyName?: string | null } | null;
  customer?: { fullName?: string; firstName?: string; lastName?: string | null } | null;
  items: Array<{ id: string; quantity: number; product: { name: string } }>;
};

export async function getProducts(search = "") {
  const response = await api.get("/products", { params: { limit: 48, status: "ACTIVE", search: search || undefined, sortBy: "createdAt", order: "desc" } });
  return response.data.data as { products: Product[]; pagination: { total: number } };
}

export async function getOrders() {
  const response = await api.get("/rental-orders", { params: { limit: 100 } });
  return response.data.data as { rentalOrders?: RentalOrder[]; orders?: RentalOrder[] };
}

export async function markOrderPickedUp(orderId: string) {
  const response = await api.post(`/rental-orders/${orderId}/pickup`, { pickupDate: new Date().toISOString() });
  return response.data.data.rentalOrder as RentalOrder;
}

export async function confirmOrder(orderId: string, method = "CASH") {
  const response = await api.post(`/rental-orders/${orderId}/confirm`, { method });
  return response.data.data.rentalOrder as RentalOrder;
}

export async function markOrderReturned(orderId: string) {
  const response = await api.post(`/rental-orders/${orderId}/return`, { returnedAt: new Date().toISOString() });
  return response.data.data.rentalOrder as RentalOrder;
}

export async function getOperationsDashboard() {
  const response = await api.get("/dashboard/rental-operations", { params: { range: "this_month" } });
  return response.data.data.dashboard as { metrics: { activeRentals: number; rentalsDueToday: number; upcomingPickups: number; upcomingReturns: number; overdueRentals: number; revenueFromRentals: string } };
}

export async function createBooking(input: { customerId: string; vendorId: string; productId: string; rentalStart: string; rentalEnd: string; quantity: number; notes?: string }) {
  const response = await api.post("/rental-orders", {
    customerId: input.customerId, vendorId: input.vendorId, rentalStart: input.rentalStart,
    rentalEnd: input.rentalEnd, notes: input.notes,
    items: [{ productId: input.productId, quantity: input.quantity }],
  });
  return response.data.data.rentalOrder as RentalOrder;
}

export async function updateProfile(input: Record<string, string | null>) {
  const response = await api.put("/auth/profile", input);
  return response.data.data.user;
}
