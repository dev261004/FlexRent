export type ProductStatus = "available" | "rented" | "maintenance";

export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  stock: number;
  deposit: number;
  status: ProductStatus;
}

export interface AdminPricelist {
  id: string;
  name: string;
  productId: string;
  productName: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
}

export interface AdminRentalPeriod {
  id: string;
  name: string;
  minDays: number;
  maxDays: number;
  multiplier: number;
}

export type UserRole = "customer" | "vendor" | "admin";
export type UserStatus = "active" | "inactive";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export type OperationStatus = "scheduled_pickup" | "picked_up" | "due_return" | "returned" | "overdue";

export interface AdminOperation {
  id: string;
  orderId: string;
  customer: string;
  product: string;
  scheduledAt: string;
  status: OperationStatus;
}

export interface OrgRentalSettings {
  lateFeePercent: number;
  flatLateFee: number;
  defaultDeposit: number;
  pickupWindowHours: number;
  returnGraceHours: number;
  orgName: string;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  header: string;
  footer: string;
}
