import { Router } from "express";
import {
  createRentalOrder,
  deleteRentalOrder,
  getRentalOrder,
  getRentalOrders,
  updateRentalOrder,
} from "../controllers/rental-order.controller";
import { requireRole, verifyJWT } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Rental Orders
 *     description: Rental order APIs for quotation and order management
 *
 * components:
 *   schemas:
 *     RentalOrderItemInput:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *         variantId:
 *           type: string
 *         assetId:
 *           type: string
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     RentalOrderInput:
 *       type: object
 *       required:
 *         - customerId
 *         - vendorId
 *         - rentalStart
 *         - rentalEnd
 *         - items
 *       properties:
 *         customerId:
 *           type: string
 *         vendorId:
 *           type: string
 *         rentalStart:
 *           type: string
 *           format: date-time
 *           example: 2026-08-01T10:00:00.000Z
 *         rentalEnd:
 *           type: string
 *           format: date-time
 *           example: 2026-08-05T18:00:00.000Z
 *         notes:
 *           type: string
 *           example: Deliver before noon
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RentalOrderItemInput'
 */

router.use(verifyJWT);

/**
 * @swagger
 * /api/rental-orders:
 *   post:
 *     summary: Create rental order
 *     tags: [Rental Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RentalOrderInput'
 *     responses:
 *       201:
 *         description: Rental order created successfully
 */
router.post("/", requireRole(["ADMIN", "VENDOR", "CUSTOMER"]), createRentalOrder);

/**
 * @swagger
 * /api/rental-orders:
 *   get:
 *     summary: List rental orders
 *     tags: [Rental Orders]
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
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerId
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
 *           enum: [QUOTATION, CONFIRMED, PICKED_UP, RETURNED, CANCELLED]
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Rental orders fetched successfully
 */
router.get("/", getRentalOrders);

/**
 * @swagger
 * /api/rental-orders/{id}:
 *   get:
 *     summary: Get rental order by id
 *     tags: [Rental Orders]
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
 *         description: Rental order fetched successfully
 */
router.get("/:id", getRentalOrder);

/**
 * @swagger
 * /api/rental-orders/{id}:
 *   put:
 *     summary: Update rental order while in draft
 *     tags: [Rental Orders]
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
 *             $ref: '#/components/schemas/RentalOrderInput'
 *     responses:
 *       200:
 *         description: Rental order updated successfully
 */
router.put("/:id", requireRole(["ADMIN", "VENDOR"]), updateRentalOrder);

/**
 * @swagger
 * /api/rental-orders/{id}:
 *   delete:
 *     summary: Delete rental order while in draft
 *     tags: [Rental Orders]
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
 *         description: Rental order deleted successfully
 */
router.delete("/:id", requireRole(["ADMIN", "VENDOR"]), deleteRentalOrder);

export default router;
