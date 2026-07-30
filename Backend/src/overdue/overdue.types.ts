export type OverdueStatusType = "ACTIVE" | "RESOLVED" | "IGNORED";

export interface CreateOverdueRecordInput {
  rentalOrderId: string;
  userId: string;
  vendorId: string;
  expectedReturnDate: Date;
  daysOverdue: number;
  notificationSent?: boolean;
  lateFeeStarted?: boolean;
}

export interface UpdateOverdueRecordInput {
  status?: OverdueStatusType;
  resolvedAt?: Date | null;
  daysOverdue?: number;
  notificationSent?: boolean;
  lateFeeStarted?: boolean;
}

export interface ListOverdueQuery {
  page?: number;
  limit?: number;
  status?: OverdueStatusType;
  vendorId?: string;
  userId?: string;
  search?: string;
}

export interface OverdueStatistics {
  totalOverdueRentals: number;
  activeOverdueRentals: number;
  resolvedOverdueRentals: number;
  ignoredOverdueRentals: number;
  averageOverdueDays: number;
  oldestOverdueRental: {
    id: string;
    rentalOrderId: string;
    expectedReturnDate: string;
    daysOverdue: number;
  } | null;
  newestOverdueRental: {
    id: string;
    rentalOrderId: string;
    detectedAt: string;
    daysOverdue: number;
  } | null;
}
