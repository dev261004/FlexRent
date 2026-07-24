-- CreateEnum
CREATE TYPE "FulfillmentMethod" AS ENUM ('HOME_DELIVERY', 'STORE_PICKUP');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "supportsStorePickup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "pickupAddressLine1" TEXT,
ADD COLUMN "pickupAddressLine2" TEXT,
ADD COLUMN "pickupCity" TEXT,
ADD COLUMN "pickupState" TEXT,
ADD COLUMN "pickupPostalCode" TEXT,
ADD COLUMN "pickupCountry" TEXT;

-- AlterTable
ALTER TABLE "RentalOrder"
ADD COLUMN "fulfillmentMethod" "FulfillmentMethod" NOT NULL DEFAULT 'HOME_DELIVERY',
ADD COLUMN "deliveryAddressLine1" TEXT,
ADD COLUMN "deliveryAddressLine2" TEXT,
ADD COLUMN "deliveryCity" TEXT,
ADD COLUMN "deliveryState" TEXT,
ADD COLUMN "deliveryPostalCode" TEXT,
ADD COLUMN "deliveryCountry" TEXT,
ADD COLUMN "pickupAddressLine1" TEXT,
ADD COLUMN "pickupAddressLine2" TEXT,
ADD COLUMN "pickupCity" TEXT,
ADD COLUMN "pickupState" TEXT,
ADD COLUMN "pickupPostalCode" TEXT,
ADD COLUMN "pickupCountry" TEXT;

-- CreateIndex
CREATE INDEX "RentalOrder_fulfillmentMethod_idx" ON "RentalOrder"("fulfillmentMethod");
