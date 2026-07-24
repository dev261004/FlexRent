import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import {
  VendorPickupRecord,
  vendorRepository,
} from "../repositories/vendor.repository";
import { ProductRequester } from "../types/product.types";
import { UpdateVendorPickupSettingsInput } from "../validations/vendor.validation";

export class VendorService {
  async updatePickupSettings(
    payload: UpdateVendorPickupSettingsInput,
    user: ProductRequester
  ) {
    if (user.role !== "VENDOR") {
      throw new AppError(403, "Only vendors can update pickup settings");
    }

    const pickupAddresses = payload.pickupAddresses;
    const storeTimings = payload.storeTimings;

    const vendor = await vendorRepository.updatePickupSettings(user.id, {
      supportsStorePickup: payload.supportsStorePickup,
      pickupAddresses: pickupAddresses ? pickupAddresses : Prisma.JsonNull,
      storeTimings: storeTimings ? storeTimings : Prisma.JsonNull,
    });

    return this.mapVendorPickupSettings(vendor);
  }

  private mapVendorPickupSettings(vendor: VendorPickupRecord) {
    return {
      id: vendor.id,
      email: vendor.email,
      role: vendor.role,
      status: vendor.status,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      fullName: [vendor.firstName, vendor.lastName].filter(Boolean).join(" "),
      companyName: vendor.companyName,
      supportsStorePickup: vendor.supportsStorePickup,
      pickupAddresses: vendor.pickupAddresses ?? null,
      storeTimings: vendor.storeTimings ?? null,
    };
  }
}

export const vendorService = new VendorService();
