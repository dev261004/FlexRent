-- CreateEnum
CREATE TYPE "OverdueStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'IGNORED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RentalStatus" ADD VALUE 'PICKUP_SCHEDULED';
ALTER TYPE "RentalStatus" ADD VALUE 'PICKUP_IN_PROGRESS';
ALTER TYPE "RentalStatus" ADD VALUE 'ACTIVE';
ALTER TYPE "RentalStatus" ADD VALUE 'RETURN_SCHEDULED';
ALTER TYPE "RentalStatus" ADD VALUE 'RETURN_IN_PROGRESS';

-- AlterTable
ALTER TABLE "RentalOrder" ADD COLUMN     "pickupArrivedAt" TIMESTAMP(3),
ADD COLUMN     "pickupConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "pickupConfirmedByCustomer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickupETAInMinutes" INTEGER,
ADD COLUMN     "pickupNotes" TEXT,
ADD COLUMN     "pickupScheduledAt" TIMESTAMP(3),
ADD COLUMN     "pickupStartedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "QuotationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "header" TEXT NOT NULL,
    "footer" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validityDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OverdueRecord" (
    "id" TEXT NOT NULL,
    "rentalOrderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "expectedReturnDate" TIMESTAMP(3) NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "daysOverdue" INTEGER NOT NULL DEFAULT 0,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "lateFeeStarted" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "status" "OverdueStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OverdueRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuotationTemplate_name_key" ON "QuotationTemplate"("name");

-- CreateIndex
CREATE INDEX "QuotationTemplate_isDefault_idx" ON "QuotationTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "QuotationTemplate_isActive_idx" ON "QuotationTemplate"("isActive");

-- CreateIndex
CREATE INDEX "OverdueRecord_rentalOrderId_idx" ON "OverdueRecord"("rentalOrderId");

-- CreateIndex
CREATE INDEX "OverdueRecord_status_idx" ON "OverdueRecord"("status");

-- CreateIndex
CREATE INDEX "OverdueRecord_detectedAt_idx" ON "OverdueRecord"("detectedAt");

-- CreateIndex
CREATE INDEX "OverdueRecord_userId_idx" ON "OverdueRecord"("userId");

-- CreateIndex
CREATE INDEX "OverdueRecord_vendorId_idx" ON "OverdueRecord"("vendorId");

-- AddForeignKey
ALTER TABLE "OverdueRecord" ADD CONSTRAINT "OverdueRecord_rentalOrderId_fkey" FOREIGN KEY ("rentalOrderId") REFERENCES "RentalOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverdueRecord" ADD CONSTRAINT "OverdueRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverdueRecord" ADD CONSTRAINT "OverdueRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
