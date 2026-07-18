import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import {
  PriceListRecord,
  priceListRepository,
} from "../repositories/price-list.repository";
import {
  CreatePriceListInput,
  ListPriceListsQuery,
  UpdatePriceListInput,
} from "../validations/price-list.validation";

const titleCase = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

export class PriceListService {
  async createPriceList(payload: CreatePriceListInput) {
    const name = titleCase(payload.name);
    await this.assertPriceListNameIsUnique(name);
    this.assertDateRange(payload.validFrom ?? null, payload.validTo ?? null);

    const data: Prisma.PriceListUncheckedCreateInput = {
      name,
      description: payload.description ?? null,
      isDefault: payload.isDefault ?? false,
      isActive: payload.isActive ?? true,
      validFrom: payload.validFrom ?? null,
      validTo: payload.validTo ?? null,
    };

    const priceList = data.isDefault
      ? await priceListRepository.transaction(async (tx) => {
          await priceListRepository.clearDefault(undefined, tx);
          return priceListRepository.createPriceList(data, tx);
        })
      : await priceListRepository.createPriceList(data);

    return this.mapPriceList(priceList);
  }

  async getPriceLists(query: ListPriceListsQuery) {
    const where = this.buildListWhere(query);
    const orderBy = this.buildOrderBy(query);
    const skip = (query.page - 1) * query.limit;
    const [priceLists, total] = await priceListRepository.getPriceLists(
      where,
      orderBy,
      skip,
      query.limit
    );

    return {
      priceLists: priceLists.map((priceList) => this.mapPriceList(priceList)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getPriceList(id: string) {
    const priceList = await priceListRepository.getPriceList(id);
    this.assertPriceListExists(priceList);

    return this.mapPriceList(priceList);
  }

  async updatePriceList(id: string, payload: UpdatePriceListInput) {
    const existingPriceList = await priceListRepository.getPriceList(id);
    this.assertPriceListExists(existingPriceList);

    const data: Prisma.PriceListUncheckedUpdateInput = {};

    if (payload.name !== undefined) {
      const name = titleCase(payload.name);
      await this.assertPriceListNameIsUnique(name, id);
      data.name = name;
    }

    if (payload.description !== undefined) {
      data.description = payload.description;
    }

    if (payload.isDefault !== undefined) {
      data.isDefault = payload.isDefault;
    }

    if (payload.isActive !== undefined) {
      data.isActive = payload.isActive;
    }

    if (payload.validFrom !== undefined) {
      data.validFrom = payload.validFrom;
    }

    if (payload.validTo !== undefined) {
      data.validTo = payload.validTo;
    }

    const nextValidFrom =
      payload.validFrom !== undefined
        ? payload.validFrom
        : existingPriceList.validFrom;
    const nextValidTo =
      payload.validTo !== undefined ? payload.validTo : existingPriceList.validTo;
    this.assertDateRange(nextValidFrom, nextValidTo);

    const priceList =
      payload.isDefault === true
        ? await priceListRepository.transaction(async (tx) => {
            await priceListRepository.clearDefault(id, tx);
            return priceListRepository.updatePriceList(id, data, tx);
          })
        : await priceListRepository.updatePriceList(id, data);

    return this.mapPriceList(priceList);
  }

  async deletePriceList(id: string) {
    const priceList = await priceListRepository.getPriceList(id);
    this.assertPriceListExists(priceList);

    const hasRules = await priceListRepository.hasRules(id);

    if (hasRules) {
      throw new AppError(
        409,
        "Price list cannot be deleted because it contains price list rules."
      );
    }

    const deletedPriceList = await priceListRepository.deletePriceList(id);
    return this.mapPriceList(deletedPriceList);
  }

  private buildListWhere(
    query: ListPriceListsQuery
  ): Prisma.PriceListWhereInput {
    return {
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.isDefault !== undefined ? { isDefault: query.isDefault } : {}),
    };
  }

  private buildOrderBy(
    query: ListPriceListsQuery
  ): Prisma.PriceListOrderByWithRelationInput[] {
    return [
      {
        [query.sortBy]: query.sortOrder,
      } as Prisma.PriceListOrderByWithRelationInput,
      { id: "asc" },
    ];
  }

  private async assertPriceListNameIsUnique(
    name: string,
    excludePriceListId?: string
  ): Promise<void> {
    const existingPriceList = await priceListRepository.existsByName(
      name,
      excludePriceListId
    );

    if (existingPriceList) {
      throw new AppError(409, "Price list name already exists", {
        name: "Price list name already exists",
      });
    }
  }

  private assertDateRange(validFrom?: Date | null, validTo?: Date | null) {
    if (validFrom && validTo && validFrom >= validTo) {
      throw new AppError(400, "validFrom must be before validTo", {
        validFrom: "validFrom must be before validTo",
      });
    }
  }

  private assertPriceListExists(
    priceList: PriceListRecord | null
  ): asserts priceList is PriceListRecord {
    if (!priceList) {
      throw new AppError(404, "Price list not found");
    }
  }

  private mapPriceList(priceList: PriceListRecord) {
    return {
      id: priceList.id,
      name: priceList.name,
      description: priceList.description,
      isDefault: priceList.isDefault,
      isActive: priceList.isActive,
      validFrom: priceList.validFrom?.toISOString() ?? null,
      validTo: priceList.validTo?.toISOString() ?? null,
      ruleCount: priceList._count.rules,
      createdAt: priceList.createdAt.toISOString(),
      updatedAt: priceList.updatedAt.toISOString(),
    };
  }
}

export const priceListService = new PriceListService();
