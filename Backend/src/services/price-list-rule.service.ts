import { Prisma, PriceRuleType } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import {
  PriceListRuleRecord,
  priceListRuleRepository,
} from "../repositories/price-list-rule.repository";
import { ProductRequester } from "../types/product.types";
import {
  CreatePriceListRuleInput,
  ListPriceListRulesQuery,
  UpdatePriceListRuleInput,
} from "../validations/price-list-rule.validation";

const decimalToString = (
  value: Prisma.Decimal | number | string | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return value.toString();
};

export class PriceListRuleService {
  async createRule(
    priceListId: string,
    payload: CreatePriceListRuleInput,
    user: ProductRequester
  ) {
    await this.assertPriceListExists(priceListId);
    await this.assertScopeIsValid(payload.productId, payload.categoryId, user);
    this.assertRuleValuesAreValid(
      payload.ruleType,
      payload.discountPercent ?? null,
      payload.fixedPrice ?? null
    );
    this.assertDateRange(payload.validFrom ?? null, payload.validTo ?? null);

    const rule = await priceListRuleRepository.createRule({
      priceListId,
      productId: payload.productId ?? null,
      categoryId: payload.categoryId ?? null,
      ruleType: payload.ruleType,
      discountPercent: payload.discountPercent ?? null,
      fixedPrice: payload.fixedPrice ?? null,
      minQuantity: payload.minQuantity,
      validFrom: payload.validFrom ?? null,
      validTo: payload.validTo ?? null,
      selectable: payload.selectable,
    });

    return this.mapRule(rule);
  }

  async getRules(priceListId: string, query: ListPriceListRulesQuery) {
    await this.assertPriceListExists(priceListId);

    const where = this.buildListWhere(priceListId, query);
    const skip = (query.page - 1) * query.limit;
    const [rules, total] = await priceListRuleRepository.getRules(
      where,
      skip,
      query.limit
    );

    return {
      rules: rules.map((rule) => this.mapRule(rule)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getRule(id: string) {
    const rule = await priceListRuleRepository.getRule(id);
    this.assertRuleExists(rule);

    return this.mapRule(rule);
  }

  async updateRule(
    id: string,
    payload: UpdatePriceListRuleInput,
    user: ProductRequester
  ) {
    const existingRule = await priceListRuleRepository.getRule(id);
    this.assertRuleExists(existingRule);

    const nextProductId =
      payload.productId !== undefined ? payload.productId : existingRule.productId;
    const nextCategoryId =
      payload.categoryId !== undefined ? payload.categoryId : existingRule.categoryId;
    const nextRuleType =
      payload.ruleType !== undefined ? payload.ruleType : existingRule.ruleType;
    const nextDiscountPercent =
      payload.discountPercent !== undefined
        ? payload.discountPercent
        : existingRule.discountPercent;
    const nextFixedPrice =
      payload.fixedPrice !== undefined ? payload.fixedPrice : existingRule.fixedPrice;
    const nextValidFrom =
      payload.validFrom !== undefined ? payload.validFrom : existingRule.validFrom;
    const nextValidTo =
      payload.validTo !== undefined ? payload.validTo : existingRule.validTo;

    await this.assertScopeIsValid(nextProductId, nextCategoryId, user);
    this.assertRuleValuesAreValid(nextRuleType, nextDiscountPercent, nextFixedPrice);
    this.assertDateRange(nextValidFrom, nextValidTo);

    const data: Prisma.PriceListRuleUncheckedUpdateInput = {};

    if (payload.productId !== undefined) data.productId = payload.productId;
    if (payload.categoryId !== undefined) data.categoryId = payload.categoryId;
    if (payload.ruleType !== undefined) data.ruleType = payload.ruleType;
    if (payload.discountPercent !== undefined) {
      data.discountPercent = payload.discountPercent;
    }
    if (payload.fixedPrice !== undefined) data.fixedPrice = payload.fixedPrice;
    if (payload.minQuantity !== undefined) data.minQuantity = payload.minQuantity;
    if (payload.validFrom !== undefined) data.validFrom = payload.validFrom;
    if (payload.validTo !== undefined) data.validTo = payload.validTo;
    if (payload.selectable !== undefined) data.selectable = payload.selectable;

    const rule = await priceListRuleRepository.updateRule(id, data);
    return this.mapRule(rule);
  }

  async deleteRule(id: string, user: ProductRequester) {
    const rule = await priceListRuleRepository.getRule(id);
    this.assertRuleExists(rule);

    if (rule.productId) {
      await this.assertProductAccess(rule.productId, user);
    }

    const deletedRule = await priceListRuleRepository.deleteRule(id);
    return this.mapRule(deletedRule);
  }

  private buildListWhere(
    priceListId: string,
    query: ListPriceListRulesQuery
  ): Prisma.PriceListRuleWhereInput {
    return {
      priceListId,
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.selectable !== undefined ? { selectable: query.selectable } : {}),
      ...(query.ruleType ? { ruleType: query.ruleType } : {}),
      ...(query.search
        ? {
            OR: [
              {
                product: {
                  name: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                product: {
                  sku: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                category: {
                  name: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
    };
  }

  private async assertPriceListExists(priceListId: string): Promise<void> {
    const priceList = await priceListRuleRepository.priceListExists(priceListId);

    if (!priceList) {
      throw new AppError(404, "Price list not found");
    }
  }

  private async assertScopeIsValid(
    productId: string | null | undefined,
    categoryId: string | null | undefined,
    user: ProductRequester
  ): Promise<void> {
    if (productId) {
      await this.assertProductAccess(productId, user);
    }

    if (categoryId) {
      const category = await priceListRuleRepository.categoryExists(categoryId);

      if (!category) {
        throw new AppError(404, "Category not found");
      }
    }
  }

  private async assertProductAccess(
    productId: string,
    user: ProductRequester
  ): Promise<void> {
    const product = await priceListRuleRepository.productExists(productId);

    if (!product) {
      throw new AppError(404, "Product not found");
    }

    if (user.role === "VENDOR" && product.vendorId !== user.id) {
      throw new AppError(403, "Vendor cannot manage rules for another vendor product");
    }
  }

  private assertRuleValuesAreValid(
    ruleType: PriceRuleType,
    discountPercent: Prisma.Decimal | number | string | null | undefined,
    fixedPrice: Prisma.Decimal | number | string | null | undefined
  ): void {
    if (ruleType === "DISCOUNT") {
      if (discountPercent === null || discountPercent === undefined) {
        throw new AppError(400, "discountPercent is required for discount rules", {
          discountPercent: "discountPercent is required for discount rules",
        });
      }

      if (fixedPrice !== null && fixedPrice !== undefined) {
        throw new AppError(400, "fixedPrice must be null for discount rules", {
          fixedPrice: "fixedPrice must be null for discount rules",
        });
      }
    }

    if (ruleType === "FIXED_PRICE") {
      if (fixedPrice === null || fixedPrice === undefined) {
        throw new AppError(400, "fixedPrice is required for fixed price rules", {
          fixedPrice: "fixedPrice is required for fixed price rules",
        });
      }

      if (discountPercent !== null && discountPercent !== undefined) {
        throw new AppError(400, "discountPercent must be null for fixed price rules", {
          discountPercent: "discountPercent must be null for fixed price rules",
        });
      }
    }
  }

  private assertDateRange(validFrom?: Date | null, validTo?: Date | null) {
    if (validFrom && validTo && validFrom >= validTo) {
      throw new AppError(400, "validFrom must be before validTo", {
        validFrom: "validFrom must be before validTo",
      });
    }
  }

  private assertRuleExists(
    rule: PriceListRuleRecord | null
  ): asserts rule is PriceListRuleRecord {
    if (!rule) {
      throw new AppError(404, "Price list rule not found");
    }
  }

  private mapRule(rule: PriceListRuleRecord) {
    return {
      id: rule.id,
      priceListId: rule.priceListId,
      productId: rule.productId,
      categoryId: rule.categoryId,
      ruleType: rule.ruleType,
      discountPercent: decimalToString(rule.discountPercent),
      fixedPrice: decimalToString(rule.fixedPrice),
      minQuantity: rule.minQuantity,
      validFrom: rule.validFrom?.toISOString() ?? null,
      validTo: rule.validTo?.toISOString() ?? null,
      selectable: rule.selectable,
      priceList: rule.priceList,
      product: rule.product,
      category: rule.category,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };
  }
}

export const priceListRuleService = new PriceListRuleService();
