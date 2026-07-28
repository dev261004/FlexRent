import { NotificationType } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import { notificationService } from "../notifications/notification.service";
import { rentalOrderRepository } from "../repositories/rental-order.repository";
import { reminderRepository } from "./reminder.repository";
import {
  cancelRentalReminderJobs,
  scheduleReminderJob,
} from "./reminder.queue";
import {
  ReminderJobData,
  ScheduleReminderOptions,
} from "./reminder.types";
import { ListRemindersQuery } from "./reminder.validation";

export class ReminderService {
  /**
   * Schedule all reminder jobs for a confirmed rental order.
   * Cancels existing scheduled jobs for this order first to ensure idempotency.
   */
  async scheduleRentalReminders(options: ScheduleReminderOptions): Promise<void> {
    const { rentalOrderId, userId, rentalNumber, rentalStart, rentalEnd } = options;

    // 1. Cancel existing scheduled jobs for this order to prevent duplicates
    await this.cancelRentalReminders(rentalOrderId);

    const now = Date.now();
    const actionUrl = `/dashboard/orders/${rentalOrderId}`;

    // Define all 6 reminder target specifications
    const targets: {
      type: NotificationType;
      triggerTime: Date;
      title: string;
      message: string;
      suffix: string;
    }[] = [
      // Pickup Reminders
      {
        type: "PICKUP_REMINDER",
        triggerTime: new Date(rentalStart.getTime() - 24 * 60 * 60 * 1000),
        title: "Upcoming Pickup",
        message: `Your rental pickup for order #${rentalNumber} is scheduled for tomorrow.`,
        suffix: "pickup_24h",
      },
      {
        type: "PICKUP_REMINDER",
        triggerTime: new Date(rentalStart.getTime() - 2 * 60 * 60 * 1000),
        title: "Pickup Soon",
        message: `Your rental pickup for order #${rentalNumber} is scheduled in 2 hours.`,
        suffix: "pickup_2h",
      },
      // Return Reminders
      {
        type: "RETURN_REMINDER",
        triggerTime: new Date(rentalEnd.getTime() - 72 * 60 * 60 * 1000),
        title: "Upcoming Return",
        message: `Your rental order #${rentalNumber} is due for return in 3 days.`,
        suffix: "return_72h",
      },
      {
        type: "RETURN_REMINDER",
        triggerTime: new Date(rentalEnd.getTime() - 24 * 60 * 60 * 1000),
        title: "Return Tomorrow",
        message: `Your rental order #${rentalNumber} is due for return tomorrow.`,
        suffix: "return_24h",
      },
      {
        type: "RETURN_REMINDER",
        triggerTime: new Date(rentalEnd.getTime() - 2 * 60 * 60 * 1000),
        title: "Return Soon",
        message: `Your rental order #${rentalNumber} is due for return in 2 hours.`,
        suffix: "return_2h",
      },
      // Due Today (09:00 AM on return date)
      {
        type: "RETURN_REMINDER",
        triggerTime: this.getDueTodayTime(rentalEnd),
        title: "Rental Due Today",
        message: `Your rental order #${rentalNumber} is due to be returned today.`,
        suffix: "due_today_9am",
      },
    ];

    // Filter target trigger times that are in the future
    for (const target of targets) {
      const delayMs = target.triggerTime.getTime() - now;

      // Skip trigger times that have already passed
      if (delayMs <= 0) continue;

      const jobId = `reminder_${rentalOrderId}_${target.suffix}`;

      // 2. Save ReminderJob DB record
      const dbRecord = await reminderRepository.create({
        rentalOrderId,
        userId,
        notificationType: target.type,
        scheduledFor: target.triggerTime,
        jobId,
        status: "SCHEDULED",
      });

      // 3. Queue BullMQ job
      const jobData: ReminderJobData = {
        rentalOrderId,
        userId,
        notificationType: target.type,
        scheduledFor: target.triggerTime.toISOString(),
        jobId,
        reminderJobDbId: dbRecord.id,
        title: target.title,
        message: target.message,
        actionUrl,
      };

      await scheduleReminderJob(jobData, delayMs);
    }
  }

  /**
   * Reschedules all reminders for a rental order (used when start/end dates change).
   */
  async rescheduleRentalReminders(options: ScheduleReminderOptions): Promise<void> {
    await this.scheduleRentalReminders(options);
  }

  /**
   * Cancels all scheduled reminders for a rental order.
   */
  async cancelRentalReminders(rentalOrderId: string): Promise<void> {
    const scheduledJobs = await reminderRepository.findScheduledByRentalOrderId(rentalOrderId);
    if (scheduledJobs.length === 0) return;

    // 1. Cancel in BullMQ
    const jobIds = scheduledJobs.map((j) => j.jobId);
    await cancelRentalReminderJobs(jobIds);

    // 2. Mark CANCELLED in DB
    await reminderRepository.cancelScheduledByRentalOrderId(rentalOrderId);
  }

  /**
   * Executes a reminder job (called by the BullMQ worker).
   */
  async executeReminderJob(data: ReminderJobData): Promise<void> {
    const { rentalOrderId, userId, notificationType, jobId, reminderJobDbId, title, message, actionUrl } = data;

    // 1. Verify DB record exists and is still SCHEDULED
    const dbRecord = await reminderRepository.findById(reminderJobDbId);
    if (!dbRecord || dbRecord.status !== "SCHEDULED") {
      console.log(`ℹ️ Reminder job ${jobId} skipped — status is ${dbRecord?.status ?? "NOT_FOUND"}`);
      return;
    }

    // 2. Verify rental order exists and is active (CONFIRMED or PICKED_UP)
    try {
      const order = await rentalOrderRepository.getRentalOrder(rentalOrderId);
      if (order.status === "CANCELLED" || order.status === "RETURNED") {
        console.log(`ℹ️ Reminder job ${jobId} skipped — order status is ${order.status}`);
        await reminderRepository.updateStatus(reminderJobDbId, "CANCELLED", {
          cancelledAt: new Date(),
        });
        return;
      }
    } catch {
      console.log(`⚠️ Reminder job ${jobId} skipped — rental order ${rentalOrderId} not found`);
      await reminderRepository.updateStatus(reminderJobDbId, "CANCELLED", {
        cancelledAt: new Date(),
        errorMessage: "Rental order not found",
      });
      return;
    }

    // 3. Deliver notification via NotificationService
    try {
      await notificationService.notify({
        userId,
        title,
        message,
        type: notificationType,
        priority: "HIGH",
        actionUrl,
        data: { rentalOrderId },
        idempotencyKey: jobId,
      });

      // 4. Mark SENT in DB
      await reminderRepository.updateStatus(reminderJobDbId, "SENT", {
        sentAt: new Date(),
      });
      console.log(`✅ Reminder job ${jobId} executed successfully`);
    } catch (error: any) {
      console.error(`❌ Reminder job ${jobId} failed:`, error.message);
      await reminderRepository.updateStatus(reminderJobDbId, "FAILED", {
        errorMessage: error.message,
      });
      throw error; // Re-throw to trigger BullMQ retry
    }
  }

  async getReminders(query: ListRemindersQuery) {
    const [jobs, total] = await reminderRepository.findMany(query);

    return {
      reminders: jobs.map((job) => this.mapReminderJob(job)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getRemindersByRentalOrder(rentalOrderId: string) {
    const jobs = await reminderRepository.findByRentalOrderId(rentalOrderId);
    return jobs.map((job) => this.mapReminderJob(job));
  }

  private getDueTodayTime(rentalEnd: Date): Date {
    const dueTime = new Date(rentalEnd);
    dueTime.setHours(9, 0, 0, 0);
    return dueTime;
  }

  private mapReminderJob(job: any) {
    return {
      id: job.id,
      rentalOrderId: job.rentalOrderId,
      userId: job.userId,
      notificationType: job.notificationType,
      scheduledFor: job.scheduledFor.toISOString(),
      jobId: job.jobId,
      status: job.status,
      sentAt: job.sentAt?.toISOString() ?? null,
      cancelledAt: job.cancelledAt?.toISOString() ?? null,
      errorMessage: job.errorMessage ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}

export const reminderService = new ReminderService();
