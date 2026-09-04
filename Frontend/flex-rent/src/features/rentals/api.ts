import api from "@/core/api";
import type { RentalOrder } from "@/features/customer/api";

export type PaymentQR = {
  amount: number;
  vendorName: string;
  upiId: string;
  upiLink: string;
};

export type RentalPayment = {
  id: string;
  amount: string;
  status: string;
  transactionId: string | null;
  paymentProof?: string | null;
  remarks?: string | null;
  submittedAt?: string;
  verifiedAt?: string | null;
  vendor?: { name: string; upiId: string | null };
};

export async function acceptOrder(orderId: string) {
  const response = await api.post(`/rental-orders/${orderId}/accept`, {});
  return response.data.data.rentalOrder as RentalOrder;
}

export async function rejectOrder(orderId: string, reason: string) {
  const response = await api.post(`/rental-orders/${orderId}/reject`, { reason });
  return response.data.data.rentalOrder as RentalOrder;
}

export async function getPaymentQR(orderId: string) {
  const response = await api.get(`/rental-orders/${orderId}/payment-qr`);
  return response.data.data.paymentQR as PaymentQR;
}

export async function submitUpiPayment(orderId: string, input: { transactionId: string; paymentProof?: string }) {
  const response = await api.post(`/rental-orders/${orderId}/payment-submit`, input);
  return response.data.data.payment as RentalPayment;
}

export async function getOrderPayment(orderId: string) {
  const response = await api.get(`/rental-orders/${orderId}/payment`);
  return response.data.data.payment as RentalPayment;
}

export async function verifyPayment(orderId: string) {
  const response = await api.post(`/rental-orders/${orderId}/payment-verify`, {});
  return response.data.data.payment as RentalPayment;
}

export async function rejectPayment(orderId: string, remarks: string) {
  const response = await api.post(`/rental-orders/${orderId}/payment-reject`, { remarks });
  return response.data.data.payment as RentalPayment;
}

export async function getTimeline(orderId: string) {
  const response = await api.get(`/rental-orders/${orderId}/timeline`);
  return response.data.data.timeline as {
    currentStatus: string;
    events: Array<{ label: string; status: string; date: string | null; completed: boolean }>;
  };
}

export async function refundDeposit(orderId: string) {
  const response = await api.post(`/rental-orders/${orderId}/refund-deposit`, {});
  return response.data.data;
}

export async function getRentalOrderInvoice(orderId: string) {
  const response = await api.get(`/rental-orders/${orderId}/invoice`);
  return response.data.data.invoice;
}

export async function downloadRentalOrderInvoice(orderId: string, autoPrint = true) {
  const response = await api.get(`/rental-orders/${orderId}/invoice`, {
    params: { format: "html", print: autoPrint ? "true" : undefined },
    responseType: "text",
    headers: { Accept: "text/html" },
  });

  const blob = new Blob([response.data], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice-${orderId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

