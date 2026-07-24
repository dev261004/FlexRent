import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

type PrismaExecutor = typeof prisma | Prisma.TransactionClient;

const vendorPickupSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  firstName: true,
  lastName: true,
  companyName: true,
  supportsStorePickup: true,
  pickupAddresses: true,
  storeTimings: true,
} satisfies Prisma.UserSelect;

export type VendorPickupRecord = Prisma.UserGetPayload<{
  select: typeof vendorPickupSelect;
}>;

export class VendorRepository {
  updatePickupSettings(id: string, data: Prisma.UserUpdateInput, db: PrismaExecutor = prisma) {
    return db.user.update({
      where: { id },
      data,
      select: vendorPickupSelect,
    });
  }
}

export const vendorRepository = new VendorRepository();
