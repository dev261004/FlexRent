import { prisma } from "../config/prisma";

type DateRange = {
  from: Date;
  to: Date;
};

export class DashboardRepository {
  getRentalOperationsMetrics(range: DateRange, vendorId?: string) {
    const now = new Date();
    const vendorFilter = vendorId ? { vendorId } : {};
    const activeStatuses = ["CONFIRMED", "PICKED_UP"];
    const paymentFilter = {
      status: "PAID",
      rentalOrder: vendorFilter,
    };

    return (prisma as any).$transaction({
      activeRentals: (prisma as any).rentalOrder.count({
        where: {
          ...vendorFilter,
          status: "PICKED_UP",
        },
      }),
      rentalsDueToday: (prisma as any).rentalOrder.count({
        where: {
          ...vendorFilter,
          status: { in: activeStatuses },
          rentalEnd: {
            gte: range.from,
            lte: range.to,
          },
        },
      }),
      upcomingPickups: (prisma as any).rentalOrder.count({
        where: {
          ...vendorFilter,
          status: "CONFIRMED",
          rentalStart: {
            gte: range.from,
            lte: range.to,
          },
        },
      }),
      upcomingReturns: (prisma as any).rentalOrder.count({
        where: {
          ...vendorFilter,
          status: "PICKED_UP",
          rentalEnd: {
            gte: range.from,
            lte: range.to,
          },
        },
      }),
      overdueRentals: (prisma as any).rentalOrder.count({
        where: {
          ...vendorFilter,
          status: "PICKED_UP",
          rentalEnd: {
            lt: now,
          },
        },
      }),
      revenueFromRentals: (prisma as any).rentalPayment.aggregate({
        where: {
          ...paymentFilter,
          notes: {
            contains: "Purpose: RENTAL",
            mode: "insensitive",
          },
          paidAt: {
            gte: range.from,
            lte: range.to,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      securityDepositsHeld: (prisma as any).securityDeposit.aggregate({
        where: {
          status: {
            in: ["COLLECTED", "PARTIALLY_REFUNDED"],
          },
          rentalOrder: vendorFilter,
        },
        _sum: {
          amount: true,
          refundedAmount: true,
          deductedAmount: true,
        },
      }),
      lateFeeCollection: (prisma as any).rentalPayment.aggregate({
        where: {
          ...paymentFilter,
          notes: {
            contains: "Purpose: LATE_FEE",
            mode: "insensitive",
          },
          paidAt: {
            gte: range.from,
            lte: range.to,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    });
  }
}

export const dashboardRepository = new DashboardRepository();
