-- AlterTable
ALTER TABLE "PriceListRule" ADD COLUMN     "durationUnit" "RentalPeriodUnit",
ADD COLUMN     "minDuration" INTEGER;

-- AlterTable
ALTER TABLE "ProductRentalConfig" ADD COLUMN     "baseRentalRate" DECIMAL(12,2),
ADD COLUMN     "maximumRentalDuration" INTEGER,
ADD COLUMN     "minimumRentalDuration" INTEGER,
ADD COLUMN     "rentalRateUnit" "RentalPeriodUnit";
