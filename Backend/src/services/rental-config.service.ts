import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import {
  ProductForRentalConfigAccess,
  RentalConfigRecord,
  rentalConfigRepository,
} from "../repositories/rental-config.repository";
import { ProductRequester } from "../types/product.types";
import {
  CreateRentalConfigInput,
  UpdateRentalConfigInput,
} from "../validations/rental-config.validation";

const decimalToString = (
  value: Prisma.Decimal | number | string | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return value.toString();
};

export class RentalConfigService {
  async createRentalConfig(
    productId: string,
    payload: CreateRentalConfigInput,
    user: ProductRequester
  ) {
    const product = await rentalConfigRepository.findProductById(productId);
    this.assertCanWrite(product, user);
    await this.assertRentalPeriodExists(payload.rentalPeriodId);

    const config = await rentalConfigRepository.transaction(async (tx) => {
      const existingConfig = await rentalConfigRepository.findByProductId(
        productId,
        tx
      );

      if (existingConfig) {
        throw new AppError(
          409,
          "Rental configuration already exists for this product"
        );
      }

      return rentalConfigRepository.create(
        {
          productId,
          rentalPeriodId: payload.rentalPeriodId,
          pickupTime: payload.pickupTime ?? null,
          returnTime: payload.returnTime ?? null,
          paddingMinutes: payload.paddingMinutes ?? 0,
          depositType: payload.depositType ?? "FIXED",
          securityDeposit: payload.securityDeposit ?? 0,
          lateFeeUnit: payload.lateFeeUnit ?? "HOUR",
          lateFee: payload.lateFee ?? 0,
          gracePeriodMinutes: payload.gracePeriodMinutes ?? 0,
          maxLateFee: payload.maxLateFee ?? null,
        },
        tx
      );
    });

    return this.mapRentalConfig(config);
  }

  async getRentalConfig(productId: string, user: ProductRequester) {
    const product = await rentalConfigRepository.findProductById(productId);
    this.assertCanRead(product, user);

    const config = await rentalConfigRepository.findByProductId(productId);
    this.assertRentalConfigExists(config);

    return this.mapRentalConfig(config);
  }

  async updateRentalConfig(
    productId: string,
    payload: UpdateRentalConfigInput,
    user: ProductRequester
  ) {
    const product = await rentalConfigRepository.findProductById(productId);
    this.assertCanWrite(product, user);

    const existingConfig = await rentalConfigRepository.findByProductId(productId);
    this.assertRentalConfigExists(existingConfig);

    if (payload.rentalPeriodId) {
      await this.assertRentalPeriodExists(payload.rentalPeriodId);
    }

    this.assertMaxLateFeeIsValid(payload, existingConfig);

    const config = await rentalConfigRepository.update(
      productId,
      this.buildUpdateData(payload)
    );

    return this.mapRentalConfig(config);
  }

  private assertCanRead(
    product: ProductForRentalConfigAccess | null,
    user: ProductRequester
  ): asserts product is ProductForRentalConfigAccess {
    if (!product) {
      throw new AppError(404, "Product not found");
    }

    if (user.role === "VENDOR" && !this.isVendorOwner(product, user.id)) {
      throw new AppError(403, "Vendors can only access their own rental config");
    }
  }

  private assertCanWrite(
    product: ProductForRentalConfigAccess | null,
    user: ProductRequester
  ): asserts product is ProductForRentalConfigAccess {
    if (!product) {
      throw new AppError(404, "Product not found");
    }

    if (user.role === "CUSTOMER") {
      throw new AppError(403, "Customers can only view rental config");
    }

    if (user.role === "VENDOR" && !this.isVendorOwner(product, user.id)) {
      throw new AppError(
        403,
        "Vendors can only configure their own products"
      );
    }
  }

  private isVendorOwner(
    product: ProductForRentalConfigAccess,
    userId: string
  ): boolean {
    return product.vendorId === userId || product.createdById === userId;
  }

  private async assertRentalPeriodExists(rentalPeriodId: string): Promise<void> {
    const rentalPeriod = await rentalConfigRepository.findRentalPeriodById(
      rentalPeriodId
    );

    if (!rentalPeriod) {
      throw new AppError(400, "Rental period does not exist or is not active", {
        rentalPeriodId: "Select a valid active rental period",
      });
    }
  }

  private assertRentalConfigExists(
    config: RentalConfigRecord | null
  ): asserts config is RentalConfigRecord {
    if (!config) {
      throw new AppError(404, "Rental configuration not found");
    }
  }

  private assertMaxLateFeeIsValid(
    payload: UpdateRentalConfigInput,
    existingConfig: RentalConfigRecord
  ): void {
    if (payload.maxLateFee === undefined || payload.maxLateFee === null) {
      return;
    }

    const lateFee =
      payload.lateFee !== undefined
        ? payload.lateFee
        : Number(existingConfig.lateFee.toString());

    if (payload.maxLateFee < lateFee) {
      throw new AppError(400, "Max late fee must be greater than or equal to late fee", {
        maxLateFee: "Max late fee must be greater than or equal to late fee",
      });
    }
  }

  private buildUpdateData(
    payload: UpdateRentalConfigInput
  ): Prisma.ProductRentalConfigUncheckedUpdateInput {
    const data: Prisma.ProductRentalConfigUncheckedUpdateInput = {};

    if (payload.rentalPeriodId !== undefined) {
      data.rentalPeriodId = payload.rentalPeriodId;
    }

    if (payload.pickupTime !== undefined) {
      data.pickupTime = payload.pickupTime;
    }

    if (payload.returnTime !== undefined) {
      data.returnTime = payload.returnTime;
    }

    if (payload.paddingMinutes !== undefined) {
      data.paddingMinutes = payload.paddingMinutes;
    }

    if (payload.depositType !== undefined) {
      data.depositType = payload.depositType;
    }

    if (payload.securityDeposit !== undefined) {
      data.securityDeposit = payload.securityDeposit;
    }

    if (payload.lateFeeUnit !== undefined) {
      data.lateFeeUnit = payload.lateFeeUnit;
    }

    if (payload.lateFee !== undefined) {
      data.lateFee = payload.lateFee;
    }

    if (payload.gracePeriodMinutes !== undefined) {
      data.gracePeriodMinutes = payload.gracePeriodMinutes;
    }

    if (payload.maxLateFee !== undefined) {
      data.maxLateFee = payload.maxLateFee;
    }

    return data;
  }

  private mapRentalConfig(config: RentalConfigRecord) {
    return {
      id: config.id,
      productId: config.productId,
      rentalPeriodId: config.rentalPeriodId,
      rentalPeriod: {
        id: config.rentalPeriod.id,
        name: config.rentalPeriod.name,
        unit: config.rentalPeriod.unit,
        duration: config.rentalPeriod.duration,
        isDefault: config.rentalPeriod.isDefault,
        isActive: config.rentalPeriod.isActive,
      },
      pickupTime: config.pickupTime,
      returnTime: config.returnTime,
      paddingMinutes: config.paddingMinutes,
      depositType: config.depositType,
      securityDeposit: decimalToString(config.securityDeposit),
      lateFeeUnit: config.lateFeeUnit,
      lateFee: decimalToString(config.lateFee),
      gracePeriodMinutes: config.gracePeriodMinutes,
      maxLateFee: decimalToString(config.maxLateFee),
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }
}

export const rentalConfigService = new RentalConfigService();
