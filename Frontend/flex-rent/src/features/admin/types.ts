export type ProductStatus = "available" | "rented" | "maintenance" | "ACTIVE" | "DRAFT" | "ARCHIVED";

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
  description?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  ruleCount?: number;
  productId?: string;
  productName?: string;
  dailyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
}

export interface AdminRentalPeriod {
  id: string;
  name: string;
  unit: "HOUR" | "DAY" | "NIGHT" | "WEEK" | "MONTH";
  duration: number;
  isDefault?: boolean;
  isActive?: boolean;
  minDays?: number;
  maxDays?: number;
  multiplier?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = "CUSTOMER" | "VENDOR" | "ADMIN" | "customer" | "vendor" | "admin";
export type UserStatus = "ACTIVE" | "DISABLED" | "active" | "inactive";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName?: string;
  lastName?: string | null;
  phone?: string | null;
  companyName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type OperationStatus =
  | "scheduled_pickup"
  | "picked_up"
  | "due_return"
  | "returned"
  | "overdue"
  | "QUOTATION"
  | "CONFIRMED"
  | "PICKUP_SCHEDULED"
  | "PICKUP_IN_PROGRESS"
  | "PICKED_UP"
  | "ACTIVE"
  | "RETURN_SCHEDULED"
  | "RETURN_IN_PROGRESS"
  | "RETURNED"
  | "CANCELLED";

export interface AdminOperation {
  id: string;
  orderId: string;
  customer: string;
  product: string;
  scheduledAt: string;
  status: OperationStatus;
  grandTotal?: string;
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
  isDefault?: boolean;
  isActive?: boolean;
  validityDays?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuotationTemplateInput {
  name: string;
  header: string;
  footer: string;
  isDefault?: boolean;
  isActive?: boolean;
  validityDays?: number;
}

export interface UpdateQuotationTemplateInput {
  name?: string;
  header?: string;
  footer?: string;
  isDefault?: boolean;
  isActive?: boolean;
  validityDays?: number;
}

export interface ListQuotationTemplatesParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "updatedAt" | "validityDays";
  sortOrder?: "asc" | "desc";
}

export interface RentalOperationsDashboardMetrics {
  activeRentals: number;
  rentalsDueToday: number;
  upcomingPickups: number;
  upcomingReturns: number;
  overdueRentals: number;
  revenueFromRentals: string;
  securityDepositsHeld: string;
  lateFeeCollection: string;
}

export interface RentalOperationsDashboardData {
  range: {
    type: string;
    from: string;
    to: string;
  };
  metrics: RentalOperationsDashboardMetrics;
}
