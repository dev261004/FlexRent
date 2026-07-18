import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "../controllers/product.controller";
import {
  deleteProductImage,
  listProductImages,
  reorderProductImages,
  setPrimaryProductImage,
  uploadProductImages,
} from "../controllers/product-image.controller";
import {
  createProductAsset,
  deleteProductAsset,
  getProductAssetById,
  listProductAssets,
  updateProductAsset,
} from "../controllers/product-asset.controller";
import { requireRole, verifyJWT } from "../middleware/auth.middleware";
import {
  createRentalConfig,
  getRentalConfig,
  updateRentalConfig,
} from "../controllers/rental-config.controller";
import {
  PRODUCT_IMAGE_FIELD_NAME,
  PRODUCT_IMAGE_MAX_FILES,
  productImageUpload,
} from "../middleware/product-image-upload.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product catalog APIs for admin, vendor, and customer access
 *   - name: Rental Configuration
 *     description: Rental configuration APIs for products
 *   - name: Product Assets
 *     description: Trackable product asset APIs
 *
 * components:
 *   schemas:
 *     ProductImageInput:
 *       type: object
 *       required:
 *         - url
 *       properties:
 *         url:
 *           type: string
 *           example: https://example.com/images/camera.jpg
 *         altText:
 *           type: string
 *           example: DSLR camera front view
 *         isPrimary:
 *           type: boolean
 *           example: true
 *         sortOrder:
 *           type: integer
 *           example: 0
 *     ProductAssetInput:
 *       type: object
 *       required:
 *         - assetTag
 *       properties:
 *         assetTag:
 *           type: string
 *           example: CAM-UNIT-001
 *         barcode:
 *           type: string
 *           example: BAR-CAM-001
 *         qrCode:
 *           type: string
 *           example: QR-CAM-001
 *         variantId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [AVAILABLE, BOOKED, PICKED_UP, LATE_PICKUP, LATE_RETURN, MAINTENANCE, RETIRED]
 *           example: AVAILABLE
 *         notes:
 *           type: string
 *     ProductAssetResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         productId:
 *           type: string
 *         variantId:
 *           type: string
 *           nullable: true
 *         assetTag:
 *           type: string
 *           example: CAM-UNIT-001
 *         barcode:
 *           type: string
 *           nullable: true
 *         qrCode:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [AVAILABLE, BOOKED, PICKED_UP, LATE_PICKUP, LATE_RETURN, MAINTENANCE, RETIRED]
 *         notes:
 *           type: string
 *           nullable: true
 *         variant:
 *           type: object
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ProductVariantInput:
 *       type: object
 *       properties:
 *         sku:
 *           type: string
 *           example: CAM-SONY-A7-BLK
 *         name:
 *           type: string
 *           example: Sony A7 Black
 *         quantityOnHand:
 *           type: integer
 *           example: 5
 *         salesPrice:
 *           type: number
 *           example: 1500
 *         costPrice:
 *           type: number
 *           example: 900
 *         isActive:
 *           type: boolean
 *           example: true
 *         attributeValueIds:
 *           type: array
 *           items:
 *             type: string
 *     ProductRentalConfigInput:
 *       type: object
 *       required:
 *         - rentalPeriodId
 *       properties:
 *         rentalPeriodId:
 *           type: string
 *         pickupTime:
 *           type: string
 *           example: "10:00"
 *         returnTime:
 *           type: string
 *           example: "18:00"
 *         paddingMinutes:
 *           type: integer
 *           example: 30
 *         depositType:
 *           type: string
 *           enum: [FIXED, PERCENTAGE]
 *           example: FIXED
 *         securityDeposit:
 *           type: number
 *           example: 5000
 *         lateFeeUnit:
 *           type: string
 *           enum: [HOUR, DAY, WEEK, MONTH]
 *           example: DAY
 *         lateFee:
 *           type: number
 *           example: 500
 *         gracePeriodMinutes:
 *           type: integer
 *           example: 60
 *         maxLateFee:
 *           type: number
 *           nullable: true
 *           example: 3000
 *     CreateProductInput:
 *       type: object
 *       required:
 *         - name
 *         - salesPrice
 *       properties:
 *         name:
 *           type: string
 *           example: Sony DSLR Camera
 *         slug:
 *           type: string
 *           example: sony-dslr-camera
 *         sku:
 *           type: string
 *           example: CAM-SONY-001
 *         description:
 *           type: string
 *           example: Professional camera available for daily rental
 *         type:
 *           type: string
 *           enum: [GOODS, SERVICE]
 *           example: GOODS
 *         status:
 *           type: string
 *           enum: [DRAFT, ACTIVE, ARCHIVED]
 *           example: ACTIVE
 *         quantityOnHand:
 *           type: integer
 *           example: 10
 *         salesPrice:
 *           type: number
 *           example: 1500
 *         costPrice:
 *           type: number
 *           example: 900
 *         categoryId:
 *           type: string
 *         vendorId:
 *           type: string
 *           description: Admin can assign vendor. Vendor accounts are assigned automatically.
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImageInput'
 *         assets:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductAssetInput'
 *         attributeIds:
 *           type: array
 *           items:
 *             type: string
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariantInput'
 *         rentalConfig:
 *           $ref: '#/components/schemas/ProductRentalConfigInput'
 *     UpdateProductInput:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateProductInput'
 *       description: Same fields as create product, but all fields are optional. Send rentalConfig as null to remove rental config.
 */

router.use(verifyJWT);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, ACTIVE, ARCHIVED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [GOODS, SERVICE]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, salesPrice, quantityOnHand, createdAt, updatedAt, status, type]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Products fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", listProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create product
 *     description: Admin can create any product. Vendor can create only their own product. Customer cannot create products.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductInput'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Product slug, SKU, asset tag, barcode, or QR code already exists
 */
router.post("/", requireRole(["ADMIN", "VENDOR"]), createProduct);

/**
 * @swagger
 * /api/products/{productId}/rental-config:
 *   post:
 *     summary: Create rental configuration
 *     description: Admin can configure any product. Vendor can configure only their own product. Only one rental config is allowed per product.
 *     tags: [Rental Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductRentalConfigInput'
 *     responses:
 *       201:
 *         description: Rental configuration created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 *       409:
 *         description: Rental configuration already exists for this product
 */
router.post(
  "/:productId/rental-config",
  requireRole(["ADMIN", "VENDOR"]),
  createRentalConfig
);

/**
 * @swagger
 * /api/products/{productId}/rental-config:
 *   get:
 *     summary: Get product rental configuration
 *     tags: [Rental Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rental configuration fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Vendor cannot access another vendor product
 *       404:
 *         description: Product or rental configuration not found
 */
router.get("/:productId/rental-config", getRentalConfig);

/**
 * @swagger
 * /api/products/{productId}/rental-config:
 *   put:
 *     summary: Update product rental configuration
 *     description: Admin can update any product rental config. Vendor can update only their own product rental config.
 *     tags: [Rental Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductRentalConfigInput'
 *     responses:
 *       200:
 *         description: Rental configuration updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product or rental configuration not found
 */
router.put(
  "/:productId/rental-config",
  requireRole(["ADMIN", "VENDOR"]),
  updateRentalConfig
);

/**
 * @swagger
 * /api/products/{productId}/assets:
 *   post:
 *     summary: Create product asset
 *     description: Admin can create assets for any product. Vendor can create assets only for their own products.
 *     tags: [Product Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductAssetInput'
 *     responses:
 *       201:
 *         description: Product asset created successfully
 *       400:
 *         description: Validation error or invalid variant
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 *       409:
 *         description: Asset tag, barcode, or QR code already exists
 */
router.post(
  "/:productId/assets",
  requireRole(["ADMIN", "VENDOR"]),
  createProductAsset
);

/**
 * @swagger
 * /api/products/{productId}/assets:
 *   get:
 *     summary: List product assets
 *     tags: [Product Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, BOOKED, PICKED_UP, LATE_PICKUP, LATE_RETURN, MAINTENANCE, RETIRED]
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [assetTag, status, createdAt, updatedAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Product assets fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Vendor cannot access another vendor product
 *       404:
 *         description: Product not found
 */
router.get("/:productId/assets", listProductAssets);

/**
 * @swagger
 * /api/products/{productId}/assets/{assetId}:
 *   get:
 *     summary: Get product asset by id
 *     tags: [Product Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product asset fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Vendor cannot access another vendor product
 *       404:
 *         description: Product asset not found
 */
router.get("/:productId/assets/:assetId", getProductAssetById);

/**
 * @swagger
 * /api/products/{productId}/assets/{assetId}:
 *   put:
 *     summary: Update product asset
 *     description: Admin can update any product asset. Vendor can update only assets for their own products.
 *     tags: [Product Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductAssetInput'
 *     responses:
 *       200:
 *         description: Product asset updated successfully
 *       400:
 *         description: Validation error or invalid variant
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product asset not found
 *       409:
 *         description: Asset tag, barcode, or QR code already exists
 */
router.put(
  "/:productId/assets/:assetId",
  requireRole(["ADMIN", "VENDOR"]),
  updateProductAsset
);

/**
 * @swagger
 * /api/products/{productId}/assets/{assetId}:
 *   delete:
 *     summary: Delete product asset
 *     description: Permanently deletes a product asset.
 *     tags: [Product Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product asset deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product asset not found
 */
router.delete(
  "/:productId/assets/:assetId",
  requireRole(["ADMIN", "VENDOR"]),
  deleteProductAsset
);

/**
 * @swagger
 * /api/products/{productId}/images:
 *   post:
 *     summary: Upload product images
 *     description: Upload up to 10 jpg, jpeg, png, or webp images. Admin can upload for any product; vendor only for their own product.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               altText:
 *                 type: string
 *           encoding:
 *             images:
 *               style: form
 *               explode: true
 *     responses:
 *       201:
 *         description: Product images uploaded successfully
 *       400:
 *         description: Validation or upload error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 */
router.post(
  "/:productId/images",
  requireRole(["ADMIN", "VENDOR"]),
  productImageUpload.array(PRODUCT_IMAGE_FIELD_NAME, PRODUCT_IMAGE_MAX_FILES),
  uploadProductImages
);

/**
 * @swagger
 * /api/products/{productId}/images:
 *   get:
 *     summary: List product images
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product images fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.get("/:productId/images", listProductImages);

/**
 * @swagger
 * /api/products/images/{imageId}/primary:
 *   patch:
 *     summary: Set primary product image
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Primary product image updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product image not found
 */
router.patch(
  "/images/:imageId/primary",
  requireRole(["ADMIN", "VENDOR"]),
  setPrimaryProductImage
);

/**
 * @swagger
 * /api/products/{productId}/images/order:
 *   patch:
 *     summary: Reorder product images
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - imageId
 *                     - sortOrder
 *                   properties:
 *                     imageId:
 *                       type: string
 *                     sortOrder:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Product image order updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 */
router.patch(
  "/:productId/images/order",
  requireRole(["ADMIN", "VENDOR"]),
  reorderProductImages
);

/**
 * @swagger
 * /api/products/images/{imageId}:
 *   delete:
 *     summary: Delete product image
 *     description: Deletes the database record and physical uploaded file.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product image deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product image not found
 */
router.delete(
  "/images/:imageId",
  requireRole(["ADMIN", "VENDOR"]),
  deleteProductImage
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by id
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Vendor cannot access another vendor product
 *       404:
 *         description: Product not found
 */
router.get("/:id", getProductById);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     description: Admin can update any product. Vendor can update only their own product.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductInput'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 */
router.put("/:id", requireRole(["ADMIN", "VENDOR"]), updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Partially update product
 *     description: Same behavior as PUT. Only sent fields are updated.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductInput'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 */
router.patch("/:id", requireRole(["ADMIN", "VENDOR"]), updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Archive product
 *     description: Soft deletes a product by changing status to ARCHIVED.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product archived successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 */
router.delete("/:id", requireRole(["ADMIN", "VENDOR"]), deleteProduct);

export default router;
