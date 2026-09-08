import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma";
import crypto from "crypto";

export interface QuotationTemplateRecord {
  id: string;
  name: string;
  header: string;
  footer: string;
  isDefault: boolean;
  isActive: boolean;
  validityDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuotationTemplateData {
  name: string;
  header: string;
  footer: string;
  isDefault?: boolean;
  isActive?: boolean;
  validityDays?: number;
}

export interface UpdateQuotationTemplateData {
  name?: string;
  header?: string;
  footer?: string;
  isDefault?: boolean;
  isActive?: boolean;
  validityDays?: number;
}

export class QuotationTemplateRepository {
  private static bootstrapped = false;

  constructor() {
    this.ensureTableAndSeed().catch((err) =>
      console.error("QuotationTemplateRepository bootstrap warning:", err.message)
    );
  }

  async ensureTableAndSeed(): Promise<void> {
    if (QuotationTemplateRepository.bootstrapped) return;

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "QuotationTemplate" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "header" TEXT NOT NULL,
          "footer" TEXT NOT NULL,
          "isDefault" BOOLEAN NOT NULL DEFAULT false,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "validityDays" INTEGER NOT NULL DEFAULT 7,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "QuotationTemplate_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "QuotationTemplate_name_key" ON "QuotationTemplate"("name");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "QuotationTemplate_isDefault_idx" ON "QuotationTemplate"("isDefault");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "QuotationTemplate_isActive_idx" ON "QuotationTemplate"("isActive");
      `);

      // Ensure updatedAt has a default in case it was created by Prisma migration without default
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "QuotationTemplate" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
      `).catch(() => {});

      // Check if table is empty to seed initial templates
      const countResult: any = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as count FROM "QuotationTemplate"`
      );
      const count = Number(countResult?.[0]?.count ?? 0);

      if (count === 0) {
        const id1 = `qt_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
        const id2 = `qt_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

        await prisma.$executeRawUnsafe(
          `INSERT INTO "QuotationTemplate" ("id", "name", "header", "footer", "isDefault", "isActive", "validityDays", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()),
                  ($8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
           ON CONFLICT ("name") DO NOTHING;`,
          id1,
          "Standard Quotation",
          "FlexRent — Equipment Rental Quotation\nThank you for choosing FlexRent. Below is your rental estimate.",
          "Terms: Deposit refundable on undamaged return.\nLate returns incur fees per org policy.\nContact: support@flexrent.app",
          true,
          true,
          7,
          id2,
          "Event Package",
          "FlexRent Event Rentals\nCustom package quotation for your event.",
          "Prices valid for 7 days. Pickup & return windows apply.\nQuestions? events@flexrent.app",
          false,
          true,
          7
        );
      }

      QuotationTemplateRepository.bootstrapped = true;
    } catch (err: any) {
      console.warn("QuotationTemplate bootstrap notice:", err.message);
    }
  }

  async createTemplate(data: CreateQuotationTemplateData): Promise<QuotationTemplateRecord> {
    await this.ensureTableAndSeed();
    const id = `qt_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const isDefault = data.isDefault ?? false;
    const isActive = data.isActive ?? true;
    const validityDays = data.validityDays ?? 7;

    if (isDefault) {
      await this.clearDefault();
    }

    const rows: any = await prisma.$queryRawUnsafe(
      `INSERT INTO "QuotationTemplate" ("id", "name", "header", "footer", "isDefault", "isActive", "validityDays", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *;`,
      id,
      data.name,
      data.header,
      data.footer,
      isDefault,
      isActive,
      validityDays
    );

    return this.mapRow(rows[0]);
  }

  async getTemplates(options: {
    search?: string;
    isActive?: boolean;
    skip: number;
    take: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<[QuotationTemplateRecord[], number]> {
    await this.ensureTableAndSeed();

    const conditions: string[] = [];
    const params: any[] = [];

    if (options.search) {
      params.push(`%${options.search}%`);
      conditions.push(`("name" ILIKE $${params.length} OR "header" ILIKE $${params.length} OR "footer" ILIKE $${params.length})`);
    }

    if (options.isActive !== undefined) {
      params.push(options.isActive);
      conditions.push(`"isActive" = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sortColumn = ["name", "createdAt", "updatedAt"].includes(options.sortBy ?? "")
      ? `"${options.sortBy}"`
      : `"isDefault" DESC, "createdAt"`;
    const sortDirection = options.sortOrder?.toLowerCase() === "desc" ? "DESC" : "ASC";

    const countResult: any = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM "QuotationTemplate" ${whereClause}`,
      ...params
    );
    const total = Number(countResult?.[0]?.count ?? 0);

    const listParams = [...params, options.take, options.skip];
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM "QuotationTemplate"
       ${whereClause}
       ORDER BY ${sortColumn} ${sortDirection}
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length};`,
      ...listParams
    );

    return [rows.map((row: any) => this.mapRow(row)), total];
  }

  async getTemplateById(id: string): Promise<QuotationTemplateRecord | null> {
    await this.ensureTableAndSeed();
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM "QuotationTemplate" WHERE "id" = $1 LIMIT 1;`,
      id
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async getTemplateByName(name: string, excludeId?: string): Promise<QuotationTemplateRecord | null> {
    await this.ensureTableAndSeed();
    const query = excludeId
      ? `SELECT * FROM "QuotationTemplate" WHERE LOWER("name") = LOWER($1) AND "id" != $2 LIMIT 1;`
      : `SELECT * FROM "QuotationTemplate" WHERE LOWER("name") = LOWER($1) LIMIT 1;`;
    const params = excludeId ? [name, excludeId] : [name];
    const rows: any = await prisma.$queryRawUnsafe(query, ...params);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async getDefaultTemplate(): Promise<QuotationTemplateRecord | null> {
    await this.ensureTableAndSeed();
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM "QuotationTemplate" WHERE "isDefault" = true AND "isActive" = true LIMIT 1;`
    );
    if (rows[0]) return this.mapRow(rows[0]);

    // Fallback to first active template
    const fallbackRows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM "QuotationTemplate" WHERE "isActive" = true ORDER BY "createdAt" ASC LIMIT 1;`
    );
    return fallbackRows[0] ? this.mapRow(fallbackRows[0]) : null;
  }

  async updateTemplate(id: string, data: UpdateQuotationTemplateData): Promise<QuotationTemplateRecord> {
    await this.ensureTableAndSeed();

    if (data.isDefault) {
      await this.clearDefault(id);
    }

    const setClauses: string[] = ['"updatedAt" = NOW()'];
    const params: any[] = [id];

    if (data.name !== undefined) {
      params.push(data.name);
      setClauses.push(`"name" = $${params.length}`);
    }
    if (data.header !== undefined) {
      params.push(data.header);
      setClauses.push(`"header" = $${params.length}`);
    }
    if (data.footer !== undefined) {
      params.push(data.footer);
      setClauses.push(`"footer" = $${params.length}`);
    }
    if (data.isDefault !== undefined) {
      params.push(data.isDefault);
      setClauses.push(`"isDefault" = $${params.length}`);
    }
    if (data.isActive !== undefined) {
      params.push(data.isActive);
      setClauses.push(`"isActive" = $${params.length}`);
    }
    if (data.validityDays !== undefined) {
      params.push(data.validityDays);
      setClauses.push(`"validityDays" = $${params.length}`);
    }

    const rows: any = await prisma.$queryRawUnsafe(
      `UPDATE "QuotationTemplate"
       SET ${setClauses.join(", ")}
       WHERE "id" = $1
       RETURNING *;`,
      ...params
    );

    return this.mapRow(rows[0]);
  }

  async deleteTemplate(id: string): Promise<QuotationTemplateRecord | null> {
    await this.ensureTableAndSeed();
    const rows: any = await prisma.$queryRawUnsafe(
      `DELETE FROM "QuotationTemplate" WHERE "id" = $1 RETURNING *;`,
      id
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async setDefaultTemplate(id: string): Promise<QuotationTemplateRecord> {
    await this.ensureTableAndSeed();
    await this.clearDefault(id);

    const rows: any = await prisma.$queryRawUnsafe(
      `UPDATE "QuotationTemplate"
       SET "isDefault" = true, "isActive" = true, "updatedAt" = NOW()
       WHERE "id" = $1
       RETURNING *;`,
      id
    );

    return this.mapRow(rows[0]);
  }

  private async clearDefault(excludeId?: string): Promise<void> {
    if (excludeId) {
      await prisma.$executeRawUnsafe(
        `UPDATE "QuotationTemplate" SET "isDefault" = false WHERE "id" != $1;`,
        excludeId
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "QuotationTemplate" SET "isDefault" = false;`
      );
    }
  }

  private mapRow(row: any): QuotationTemplateRecord {
    return {
      id: row.id,
      name: row.name,
      header: row.header,
      footer: row.footer,
      isDefault: Boolean(row.isDefault),
      isActive: Boolean(row.isActive),
      validityDays: Number(row.validityDays ?? 7),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}

export const quotationTemplateRepository = new QuotationTemplateRepository();
