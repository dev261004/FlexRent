-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('GOODS', 'SERVICE');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttributeDisplayType" AS ENUM ('RADIO', 'PILLS', 'CHECKBOX', 'IMAGE');

-- CreateEnum
CREATE TYPE "RentalPeriodUnit" AS ENUM ('HOUR', 'DAY', 'NIGHT', 'WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "DepositType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "LateFeeUnit" AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "PriceRuleType" AS ENUM ('DISCOUNT', 'FIXED_PRICE');

-- CreateEnum
CREATE TYPE "ProductAssetStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'PICKED_UP', 'LATE_PICKUP', 'LATE_RETURN', 'MAINTENANCE', 'RETIRED');

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "type" "ProductType" NOT NULL DEFAULT 'GOODS',
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "salesPrice" DECIMAL(12,2) NOT NULL,
    "costPrice" DECIMAL(12,2),
    "categoryId" TEXT,
    "createdById" TEXT NOT NULL,
    "vendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAsset" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "assetTag" TEXT NOT NULL,
    "barcode" TEXT,
    "qrCode" TEXT,
    "status" "ProductAssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayType" "AttributeDisplayType" NOT NULL DEFAULT 'RADIO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttributeValue" (
    "id" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "colorHex" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttributeOnProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAttributeOnProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "salesPrice" DECIMAL(12,2),
    "costPrice" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantValue" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "attributeValueId" TEXT NOT NULL,

    CONSTRAINT "ProductVariantValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalPeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "RentalPeriodUnit" NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 1,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRentalConfig" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rentalPeriodId" TEXT NOT NULL,
    "pickupTime" TEXT,
    "returnTime" TEXT,
    "paddingMinutes" INTEGER NOT NULL DEFAULT 0,
    "depositType" "DepositType" NOT NULL DEFAULT 'FIXED',
    "securityDeposit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lateFeeUnit" "LateFeeUnit" NOT NULL DEFAULT 'HOUR',
    "lateFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gracePeriodMinutes" INTEGER NOT NULL DEFAULT 0,
    "maxLateFee" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductRentalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListRule" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "productId" TEXT,
    "categoryId" TEXT,
    "ruleType" "PriceRuleType" NOT NULL,
    "discountPercent" DECIMAL(5,2),
    "fixedPrice" DECIMAL(12,2),
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "selectable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceListRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");
CREATE INDEX "ProductCategory_isActive_idx" ON "ProductCategory"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_createdById_idx" ON "Product"("createdById");
CREATE INDEX "Product_vendorId_idx" ON "Product"("vendorId");
CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_type_idx" ON "Product"("type");
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");
CREATE INDEX "ProductImage_isPrimary_idx" ON "ProductImage"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAsset_assetTag_key" ON "ProductAsset"("assetTag");
CREATE UNIQUE INDEX "ProductAsset_barcode_key" ON "ProductAsset"("barcode");
CREATE UNIQUE INDEX "ProductAsset_qrCode_key" ON "ProductAsset"("qrCode");
CREATE INDEX "ProductAsset_productId_idx" ON "ProductAsset"("productId");
CREATE INDEX "ProductAsset_variantId_idx" ON "ProductAsset"("variantId");
CREATE INDEX "ProductAsset_status_idx" ON "ProductAsset"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttribute_name_key" ON "ProductAttribute"("name");
CREATE UNIQUE INDEX "ProductAttribute_slug_key" ON "ProductAttribute"("slug");
CREATE INDEX "ProductAttribute_displayType_idx" ON "ProductAttribute"("displayType");
CREATE INDEX "ProductAttribute_isActive_idx" ON "ProductAttribute"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeValue_attributeId_value_key" ON "ProductAttributeValue"("attributeId", "value");
CREATE UNIQUE INDEX "ProductAttributeValue_attributeId_slug_key" ON "ProductAttributeValue"("attributeId", "slug");
CREATE INDEX "ProductAttributeValue_attributeId_idx" ON "ProductAttributeValue"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttributeOnProduct_productId_attributeId_key" ON "ProductAttributeOnProduct"("productId", "attributeId");
CREATE INDEX "ProductAttributeOnProduct_productId_idx" ON "ProductAttributeOnProduct"("productId");
CREATE INDEX "ProductAttributeOnProduct_attributeId_idx" ON "ProductAttributeOnProduct"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX "ProductVariant_isActive_idx" ON "ProductVariant"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantValue_variantId_attributeValueId_key" ON "ProductVariantValue"("variantId", "attributeValueId");
CREATE INDEX "ProductVariantValue_attributeValueId_idx" ON "ProductVariantValue"("attributeValueId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalPeriod_name_key" ON "RentalPeriod"("name");
CREATE INDEX "RentalPeriod_unit_idx" ON "RentalPeriod"("unit");
CREATE INDEX "RentalPeriod_isActive_idx" ON "RentalPeriod"("isActive");
CREATE INDEX "RentalPeriod_isDefault_idx" ON "RentalPeriod"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRentalConfig_productId_key" ON "ProductRentalConfig"("productId");
CREATE INDEX "ProductRentalConfig_rentalPeriodId_idx" ON "ProductRentalConfig"("rentalPeriodId");
CREATE INDEX "ProductRentalConfig_depositType_idx" ON "ProductRentalConfig"("depositType");
CREATE INDEX "ProductRentalConfig_lateFeeUnit_idx" ON "ProductRentalConfig"("lateFeeUnit");

-- CreateIndex
CREATE UNIQUE INDEX "PriceList_name_key" ON "PriceList"("name");
CREATE INDEX "PriceList_isDefault_idx" ON "PriceList"("isDefault");
CREATE INDEX "PriceList_isActive_idx" ON "PriceList"("isActive");
CREATE INDEX "PriceList_validFrom_validTo_idx" ON "PriceList"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "PriceListRule_priceListId_idx" ON "PriceListRule"("priceListId");
CREATE INDEX "PriceListRule_productId_idx" ON "PriceListRule"("productId");
CREATE INDEX "PriceListRule_categoryId_idx" ON "PriceListRule"("categoryId");
CREATE INDEX "PriceListRule_ruleType_idx" ON "PriceListRule"("ruleType");
CREATE INDEX "PriceListRule_selectable_idx" ON "PriceListRule"("selectable");
CREATE INDEX "PriceListRule_validFrom_validTo_idx" ON "PriceListRule"("validFrom", "validTo");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductAsset" ADD CONSTRAINT "ProductAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductAsset" ADD CONSTRAINT "ProductAsset_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductAttributeOnProduct" ADD CONSTRAINT "ProductAttributeOnProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductAttributeOnProduct" ADD CONSTRAINT "ProductAttributeOnProduct_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductVariantValue" ADD CONSTRAINT "ProductVariantValue_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductVariantValue" ADD CONSTRAINT "ProductVariantValue_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "ProductAttributeValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductRentalConfig" ADD CONSTRAINT "ProductRentalConfig_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductRentalConfig" ADD CONSTRAINT "ProductRentalConfig_rentalPeriodId_fkey" FOREIGN KEY ("rentalPeriodId") REFERENCES "RentalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PriceListRule" ADD CONSTRAINT "PriceListRule_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceListRule" ADD CONSTRAINT "PriceListRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceListRule" ADD CONSTRAINT "PriceListRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
