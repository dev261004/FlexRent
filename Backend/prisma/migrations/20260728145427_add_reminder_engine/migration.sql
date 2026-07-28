-- CreateEnum
CREATE TYPE "ReminderJobStatus" AS ENUM ('SCHEDULED', 'SENT', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ReminderJob" (
    "id" TEXT NOT NULL,
    "rentalOrderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "ReminderJobStatus" NOT NULL DEFAULT 'SCHEDULED',
    "sentAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReminderJob_jobId_key" ON "ReminderJob"("jobId");

-- CreateIndex
CREATE INDEX "ReminderJob_rentalOrderId_status_idx" ON "ReminderJob"("rentalOrderId", "status");

-- CreateIndex
CREATE INDEX "ReminderJob_userId_status_idx" ON "ReminderJob"("userId", "status");

-- CreateIndex
CREATE INDEX "ReminderJob_scheduledFor_status_idx" ON "ReminderJob"("scheduledFor", "status");

-- CreateIndex
CREATE INDEX "ReminderJob_status_idx" ON "ReminderJob"("status");

-- AddForeignKey
ALTER TABLE "ReminderJob" ADD CONSTRAINT "ReminderJob_rentalOrderId_fkey" FOREIGN KEY ("rentalOrderId") REFERENCES "RentalOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderJob" ADD CONSTRAINT "ReminderJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
