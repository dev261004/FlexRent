/*
  Warnings:

  - You are about to drop the column `pickupAddressLine1` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pickupAddressLine2` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pickupCity` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pickupCountry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pickupPostalCode` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pickupState` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "pickupAddressLine1",
DROP COLUMN "pickupAddressLine2",
DROP COLUMN "pickupCity",
DROP COLUMN "pickupCountry",
DROP COLUMN "pickupPostalCode",
DROP COLUMN "pickupState",
ADD COLUMN     "pickupAddresses" JSONB,
ADD COLUMN     "storeTimings" JSONB;
