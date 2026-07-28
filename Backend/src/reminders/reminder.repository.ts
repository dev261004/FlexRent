import { Prisma, ReminderJobStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ListRemindersQuery } from "./reminder.validation";

const reminderJobSelect = {
  id: true,
  rentalOrderId: true,
  userId: true,
  notificationType: true,
  scheduledFor: true,
  jobId: true,
  status: true,
  sentAt: true,
  cancelledAt: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReminderJobSelect;

export type ReminderJobRow = Prisma.ReminderJobGetPayload<{
  select: typeof reminderJobSelect;
}>;

export class ReminderRepository {
  create(
    data: Prisma.ReminderJobUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<ReminderJobRow> {
    const client = tx ?? prisma;
    return client.reminderJob.create({
      data,
      select: reminderJobSelect,
    });
  }

  findByJobId(
    jobId: string,
    tx?: Prisma.TransactionClient
  ): Promise<ReminderJobRow | null> {
    const client = tx ?? prisma;
    return client.reminderJob.findUnique({
      where: { jobId },
      select: reminderJobSelect,
    });
  }

  findById(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<ReminderJobRow | null> {
    const client = tx ?? prisma;
    return client.reminderJob.findUnique({
      where: { id },
      select: reminderJobSelect,
    });
  }

  async findMany(
    query: ListRemindersQuery
  ): Promise<[ReminderJobRow[], number]> {
    const where: Prisma.ReminderJobWhereInput = {
      ...(query.rentalOrderId ? { rentalOrderId: query.rentalOrderId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const skip = (query.page - 1) * query.limit;

    return prisma.$transaction([
      prisma.reminderJob.findMany({
        where,
        orderBy: [{ createdAt: query.sortOrder }, { id: "desc" }],
        skip,
        take: query.limit,
        select: reminderJobSelect,
      }),
      prisma.reminderJob.count({ where }),
    ]);
  }

  findByRentalOrderId(
    rentalOrderId: string
  ): Promise<ReminderJobRow[]> {
    return prisma.reminderJob.findMany({
      where: { rentalOrderId },
      orderBy: { scheduledFor: "asc" },
      select: reminderJobSelect,
    });
  }

  findScheduledByRentalOrderId(
    rentalOrderId: string
  ): Promise<ReminderJobRow[]> {
    return prisma.reminderJob.findMany({
      where: { rentalOrderId, status: "SCHEDULED" },
      select: reminderJobSelect,
    });
  }

  updateStatus(
    id: string,
    status: ReminderJobStatus,
    data?: {
      sentAt?: Date;
      cancelledAt?: Date;
      errorMessage?: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<ReminderJobRow> {
    const client = tx ?? prisma;
    return client.reminderJob.update({
      where: { id },
      data: {
        status,
        ...(data?.sentAt ? { sentAt: data.sentAt } : {}),
        ...(data?.cancelledAt ? { cancelledAt: data.cancelledAt } : {}),
        ...(data?.errorMessage !== undefined ? { errorMessage: data.errorMessage } : {}),
      },
      select: reminderJobSelect,
    });
  }

  async cancelScheduledByRentalOrderId(
    rentalOrderId: string,
    tx?: Prisma.TransactionClient
  ): Promise<{ count: number }> {
    const client = tx ?? prisma;
    return client.reminderJob.updateMany({
      where: { rentalOrderId, status: "SCHEDULED" },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });
  }
}

export const reminderRepository = new ReminderRepository();
