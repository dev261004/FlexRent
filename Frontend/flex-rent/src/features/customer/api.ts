import api from "@/core/api";

export type Product = {
  id: string; name: string; slug: string; description: string | null; salesPrice: string;
  quantityOnHand: number; category: { id: string; name: string } | null;
  primaryImage: { url: string; altText?: string | null } | null;
  vendor: { id: string; fullName: string; companyName?: string | null } | null;
  rentalConfig?: { depositType: string; securityDeposit: string; rentalRateUnit?: string | null; minimumRentalDuration?: number | null; maximumRentalDuration?: number | null; minDurationUnit?: string | null; maxDurationUnit?: string | null } | null;
};

export type RentalOrder = {
  id: string; rentalNumber: string; status: string; paymentStatus: string;
  customerId?: string; vendorId?: string; approvedAt?: string | null; createdAt?: string;
  actualPickupAt?: string | null; actualReturnAt?: string | null;
  pickupScheduledAt?: string | null; pickupStartedAt?: string | null;
  pickupArrivedAt?: string | null; pickupETAInMinutes?: number | null;
  pickupNotes?: string | null; pickupConfirmedByCustomer?: boolean;
  pickupConfirmedAt?: string | null;
  rejectedAt?: string | null; rejectionReason?: string | null; notes?: string | null;
  rentalStart: string; rentalEnd: string; grandTotal: string; subtotal: string;
  securityDepositAmount: string; lateFee?: string;
  securityDeposit?: { id: string; amount: string; refundedAmount: string; deductedAmount: string; status: string; collectedAt?: string | null; refundedAt?: string | null } | null;
  fulfillmentMethod?: string;
  deliveryAddress?: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  } | null;
  pickupLocation?: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  } | null;
  vendor?: { fullName?: string; firstName?: string; lastName?: string | null; companyName?: string | null; email?: string; phone?: string | null; upiId?: string | null } | null;
  customer?: { fullName?: string; firstName?: string; lastName?: string | null; email?: string; phone?: string | null } | null;
  items: Array<{ id: string; quantity: number; rentalPrice?: string; deposit?: string; subtotal?: string; product: { name: string; description?: string | null; primaryImage?: { url: string; altText?: string | null } | null; category?: { name: string } | null } }>;
  payments?: Array<{ id: string; amount: string; method: string; status: string; transactionId?: string | null; paymentProof?: string | null; remarks?: string | null; createdAt?: string; verifiedAt?: string | null }>;
  paymentSummary?: { totalPaid?: string; outstandingBalance?: string; refundableDeposit?: string };
};

export async function getProducts(search = "") {
  const response = await api.get("/products", { params: { limit: 48, status: "ACTIVE", search: search || undefined, sortBy: "createdAt", order: "desc" } });
  return response.data.data as { products: (Product & { fulfillmentOptions?: any })[]; pagination: { total: number } };
}

export async function getOrders() {
  const response = await api.get("/rental-orders", { params: { limit: 100 } });
  return response.data.data as { rentalOrders?: RentalOrder[]; orders?: RentalOrder[] };
}

export async function getOrder(orderId: string) {
  const response = await api.get(`/rental-orders/${orderId}`);
  return response.data.data.rentalOrder as RentalOrder;
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

export type PickupTimelineStage = {
  id: string;
  label: string;
  completed: boolean;
  timestamp: string | null;
};

export type PickupTimeline = {
  orderId: string;
  rentalNumber: string;
  status: string;
  currentStage: string;
  pickupETAInMinutes: number | null;
  pickupNotes: string | null;
  scheduledTime: string | null;
  actualPickupAt: string | null;
  rentalStart: string | null;
  rentalEnd: string | null;
  stages: PickupTimelineStage[];
};

export async function schedulePickup(orderId: string, payload: { pickupScheduledAt: string; pickupETAInMinutes?: number; notes?: string }) {
  const response = await api.post(`/rental-orders/${orderId}/schedule-pickup`, payload);
  return response.data.data.rentalOrder as RentalOrder;
}

export async function startPickupJourney(orderId: string) {
  const response = await api.post(`/rental-orders/${orderId}/start-pickup`);
  return response.data.data.rentalOrder as RentalOrder;
}

export async function markVendorArrived(orderId: string) {
  const response = await api.post(`/rental-orders/${orderId}/arrive`);
  return response.data.data.rentalOrder as RentalOrder;
}

export async function updatePickupEta(orderId: string, pickupETAInMinutes: number, notes?: string) {
  const response = await api.post(`/rental-orders/${orderId}/update-eta`, { pickupETAInMinutes, notes });
  return response.data.data.rentalOrder as RentalOrder;
}

export async function completePickupVendor(orderId: string, notes?: string) {
  const response = await api.post(`/rental-orders/${orderId}/complete-pickup`, { notes });
  return response.data.data.rentalOrder as RentalOrder;
}

export async function confirmPickupCustomer(orderId: string, notes?: string) {
  const response = await api.post(`/rental-orders/${orderId}/confirm-pickup`, { notes });
  return response.data.data.rentalOrder as RentalOrder;
}

export async function getPickupTimeline(orderId: string) {
  const response = await api.get(`/rental-orders/${orderId}/pickup-timeline`);
  return response.data.data.timeline as PickupTimeline;
}

export async function getOperationsDashboard() {
  const response = await api.get("/dashboard/rental-operations", { params: { range: "this_month" } });
  return response.data.data.dashboard as { metrics: { activeRentals: number; rentalsDueToday: number; upcomingPickups: number; upcomingReturns: number; overdueRentals: number; revenueFromRentals: string } };
}

export async function createBooking(input: { customerId: string; vendorId: string; productId: string; rentalStart: string; rentalEnd: string; quantity: number; notes?: string; fulfillmentMethod?: string; deliveryAddress?: any; pickupAddress?: any }) {
  const response = await api.post("/rental-orders", {
    customerId: input.customerId, vendorId: input.vendorId, rentalStart: input.rentalStart,
    rentalEnd: input.rentalEnd, notes: input.notes,
    fulfillmentMethod: input.fulfillmentMethod,
    deliveryAddress: input.deliveryAddress,
    pickupAddress: input.pickupAddress,
    items: [{ productId: input.productId, quantity: input.quantity }],
  });
  return response.data.data.rentalOrder as RentalOrder;
}

export async function updatePickupSettings(supportsStorePickup: boolean, pickupAddresses?: any, storeTimings?: any) {
  const response = await api.put("/vendors/me/pickup-settings", {
    supportsStorePickup,
    pickupAddresses,
    storeTimings,
  });
  return response.data.data;
}

export async function updateProfile(input: Record<string, string | null>) {
  const response = await api.put("/auth/profile", input);
  return response.data.data.user;
}

export async function uploadProfileImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post("/auth/profile-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data.data.user;
}

export async function previewBooking(payload: { vendorId: string; rentalStart: string; rentalEnd: string; items: { productId: string; quantity: number }[] }) {
  const response = await api.post("/rental-orders/preview", payload);
  return response.data.data.preview as {
    subtotal: string;
    securityDepositAmount: string;
    lateFee: string;
    grandTotal: string;
    items: any[];
  };
}
