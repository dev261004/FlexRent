import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "../controllers/product.controller";
import { requireRole, verifyJWT } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product catalog APIs for admin, vendor, and customer access
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
