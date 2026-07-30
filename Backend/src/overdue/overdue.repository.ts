import { OverdueStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  CreateOverdueRecordInput,
  ListOverdueQuery,
  UpdateOverdueRecordInput,
} from "./overdue.types";

export class OverdueRepository {
  /**
   * Find potential overdue rentals:
   * status = PICKED_UP, actualReturnAt is NULL, rentalEnd < current time.
   */
  async findPotentialOverdues() {
    const now = new Date();
    return prisma.rentalOrder.findMany({
      where: {
        status: "PICKED_UP",
        actualReturnAt: null,
        rentalEnd: {
          lt: now,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        vendor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        overdueRecords: true,
      },
    });
  }

  /**
   * Find existing overdue record for a rental order (any status or active).
   */
  async findByRental(rentalOrderId: string) {
    return prisma.overdueRecord.findFirst({
      where: { rentalOrderId },
      orderBy: { createdAt: "desc" },
      include: {
        rentalOrder: {
          select: {
            id: true,
            rentalNumber: true,
            rentalStart: true,
            rentalEnd: true,
            status: true,
            actualReturnAt: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        vendor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
    });
  }

  /**
   * Find active overdue record by rental order ID.
   */
  async findActiveByRental(rentalOrderId: string) {
    return prisma.overdueRecord.findFirst({
      where: {
        rentalOrderId,
        status: OverdueStatus.ACTIVE,
      },
    });
  }

  /**
   * Find single overdue record by ID.
   */
  async findById(id: string) {
    return prisma.overdueRecord.findUnique({
      where: { id },
      include: {
        rentalOrder: {
          select: {
            id: true,
            rentalNumber: true,
            rentalStart: true,
            rentalEnd: true,
            status: true,
            actualReturnAt: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        vendor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
    });
  }

  /**
   * Create new overdue record.
   */
  async create(data: CreateOverdueRecordInput) {
    return prisma.overdueRecord.create({
      data: {
        rentalOrderId: data.rentalOrderId,
        userId: data.userId,
        vendorId: data.vendorId,
        expectedReturnDate: data.expectedReturnDate,
        daysOverdue: data.daysOverdue,
        notificationSent: data.notificationSent ?? false,
        lateFeeStarted: data.lateFeeStarted ?? false,
        status: OverdueStatus.ACTIVE,
      },
    });
  }

  /**
   * Update overdue record by ID.
   */
  async update(id: string, data: UpdateOverdueRecordInput) {
    return prisma.overdueRecord.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status as OverdueStatus }),
        ...(data.resolvedAt !== undefined && { resolvedAt: data.resolvedAt }),
        ...(data.daysOverdue !== undefined && { daysOverdue: data.daysOverdue }),
        ...(data.notificationSent !== undefined && { notificationSent: data.notificationSent }),
        ...(data.lateFeeStarted !== undefined && { lateFeeStarted: data.lateFeeStarted }),
      },
    });
  }

  /**
   * Mark active overdue record as RESOLVED for a rental order.
   */
  async markResolved(rentalOrderId: string, resolvedAt: Date = new Date()) {
    return prisma.overdueRecord.updateMany({
      where: {
        rentalOrderId,
        status: OverdueStatus.ACTIVE,
      },
      data: {
        status: OverdueStatus.RESOLVED,
        resolvedAt,
      },
    });
  }

  /**
   * Mark overdue record as IGNORED by record ID.
   */
  async markIgnored(id: string) {
    return prisma.overdueRecord.update({
      where: { id },
      data: {
        status: OverdueStatus.IGNORED,
      },
    });
  }

  /**
   * List overdue records with pagination and filtering.
   */
  async findMany(query: ListOverdueQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OverdueRecordWhereInput = {};

    if (query.status) {
      where.status = query.status as OverdueStatus;
    }

    if (query.vendorId) {
      where.vendorId = query.vendorId;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.search) {
      where.OR = [
        { rentalOrderId: { contains: query.search, mode: "insensitive" } },
        { rentalOrder: { rentalNumber: { contains: query.search, mode: "insensitive" } } },
        { user: { email: { contains: query.search, mode: "insensitive" } } },
        { user: { firstName: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.overdueRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { detectedAt: "desc" },
        include: {
          rentalOrder: {
            select: {
              id: true,
              rentalNumber: true,
              rentalStart: true,
              rentalEnd: true,
              status: true,
              actualReturnAt: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          vendor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
        },
      }),
      prisma.overdueRecord.count({ where }),
    ]);

    return [records, total] as const;
  }

  /**
   * Calculate summary statistics for dashboard.
   */
  async findStatistics(vendorId?: string, userId?: string) {
    const where: Prisma.OverdueRecordWhereInput = {};
    if (vendorId) where.vendorId = vendorId;
    if (userId) where.userId = userId;

    const [
      totalCount,
      activeCount,
      resolvedCount,
      ignoredCount,
      activeRecords,
      oldestActive,
      newestActive,
    ] = await Promise.all([
      prisma.overdueRecord.count({ where }),
      prisma.overdueRecord.count({ where: { ...where, status: OverdueStatus.ACTIVE } }),
      prisma.overdueRecord.count({ where: { ...where, status: OverdueStatus.RESOLVED } }),
      prisma.overdueRecord.count({ where: { ...where, status: OverdueStatus.IGNORED } }),
      prisma.overdueRecord.findMany({
        where: { ...where, status: OverdueStatus.ACTIVE },
        select: { daysOverdue: true },
      }),
      prisma.overdueRecord.findFirst({
        where: { ...where, status: OverdueStatus.ACTIVE },
        orderBy: { expectedReturnDate: "asc" },
        select: {
          id: true,
          rentalOrderId: true,
          expectedReturnDate: true,
          daysOverdue: true,
        },
      }),
      prisma.overdueRecord.findFirst({
        where: { ...where, status: OverdueStatus.ACTIVE },
        orderBy: { detectedAt: "desc" },
        select: {
          id: true,
          rentalOrderId: true,
          detectedAt: true,
          daysOverdue: true,
        },
      }),
    ]);

    const totalDays = activeRecords.reduce((acc: number, curr: { daysOverdue: number }) => acc + curr.daysOverdue, 0);
    const averageDays = activeRecords.length > 0 ? Math.round((totalDays / activeRecords.length) * 10) / 10 : 0;

    return {
      totalOverdueRentals: totalCount,
      activeOverdueRentals: activeCount,
      resolvedOverdueRentals: resolvedCount,
      ignoredOverdueRentals: ignoredCount,
      averageOverdueDays: averageDays,
      oldestOverdueRental: oldestActive
        ? {
            id: oldestActive.id,
            rentalOrderId: oldestActive.rentalOrderId,
            expectedReturnDate: oldestActive.expectedReturnDate.toISOString(),
            daysOverdue: oldestActive.daysOverdue,
          }
        : null,
      newestOverdueRental: newestActive
        ? {
            id: newestActive.id,
            rentalOrderId: newestActive.rentalOrderId,
            detectedAt: newestActive.detectedAt.toISOString(),
            daysOverdue: newestActive.daysOverdue,
          }
        : null,
    };
  }
}

export const overdueRepository = new OverdueRepository();
