import { NotificationType, ReminderJobStatus } from "@prisma/client";

export interface ReminderJobData {
  rentalOrderId: string;
  userId: string;
  notificationType: NotificationType;
  scheduledFor: string; // ISO date string
  jobId: string;
  reminderJobDbId: string;
  title: string;
  message: string;
  actionUrl: string;
}

export interface ScheduleReminderOptions {
  rentalOrderId: string;
  userId: string;
  rentalNumber: string;
  rentalStart: Date;
  rentalEnd: Date;
}

export interface ReminderJobRecordResponse {
  id: string;
  rentalOrderId: string;
  userId: string;
  notificationType: NotificationType;
  scheduledFor: string;
  jobId: string;
  status: ReminderJobStatus;
  sentAt: string | null;
  cancelledAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
