ALTER TABLE "RentalOrder" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "RentalOrder" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "RentalOrder" ADD COLUMN "rejectedAt" TIMESTAMP(3);
ALTER TABLE "RentalOrder" ADD COLUMN "rejectedBy" TEXT;
ALTER TABLE "RentalOrder" ADD COLUMN "rejectionReason" TEXT;
