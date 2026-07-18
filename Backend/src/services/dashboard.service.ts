import { AppError } from "../middleware/error.middleware";
import { dashboardRepository } from "../repositories/dashboard.repository";
import { ProductRequester } from "../types/product.types";
import { RentalOperationsDashboardQuery } from "../validations/dashboard.validation";

const toAmount = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  return Number(value.toString());
};

const startOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

export class DashboardService {
  async getRentalOperationsDashboard(
    query: RentalOperationsDashboardQuery,
    user: ProductRequester
  ) {
    const range = this.resolveRange(query);
    const vendorId = this.resolveVendorFilter(query.vendorId, user);
    const metrics = await dashboardRepository.getRentalOperationsMetrics(
      range,
      vendorId
    );
    const depositSum = metrics.securityDepositsHeld._sum;
    const securityDepositsHeld =
      toAmount(depositSum.amount) -
      toAmount(depositSum.refundedAmount) -
      toAmount(depositSum.deductedAmount);

    return {
      range: {
        type: query.range,
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      filters: {
        vendorId: vendorId ?? null,
      },
      metrics: {
        activeRentals: metrics.activeRentals,
        rentalsDueToday: metrics.rentalsDueToday,
        upcomingPickups: metrics.upcomingPickups,
        upcomingReturns: metrics.upcomingReturns,
        overdueRentals: metrics.overdueRentals,
        revenueFromRentals: toAmount(
          metrics.revenueFromRentals._sum.amount
        ).toFixed(2),
        securityDepositsHeld: Math.max(securityDepositsHeld, 0).toFixed(2),
        lateFeeCollection: toAmount(
          metrics.lateFeeCollection._sum.amount
        ).toFixed(2),
      },
    };
  }

  private resolveVendorFilter(vendorId: string | undefined, user: ProductRequester) {
    if (user.role === "CUSTOMER") {
      throw new AppError(403, "Customers cannot access rental operations dashboard");
    }

    if (user.role === "VENDOR") {
      return user.id;
    }

    return vendorId;
  }

  private resolveRange(query: RentalOperationsDashboardQuery) {
    const now = new Date();

    if (query.range === "custom") {
      return {
        from: query.fromDate!,
        to: query.toDate!,
      };
    }

    if (query.range === "this_week") {
      const from = startOfDay(now);
      const day = from.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      from.setDate(from.getDate() + mondayOffset);

      const to = endOfDay(from);
      to.setDate(from.getDate() + 6);

      return { from, to };
    }

    if (query.range === "this_month") {
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    }

    return {
      from: startOfDay(now),
      to: endOfDay(now),
    };
  }
}

export const dashboardService = new DashboardService();
