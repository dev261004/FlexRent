import { Router } from "express";
import {
  createPriceList,
  deletePriceList,
  getPriceList,
  getPriceLists,
  updatePriceList,
} from "../controllers/price-list.controller";
import { requireRole, verifyJWT } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Price Lists
 *     description: Price list APIs for rental pricing
 *
 * components:
 *   schemas:
 *     PriceListInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Weekend Pricing
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: Weekend rental pricing
 *         isDefault:
 *           type: boolean
 *           example: false
 *         isActive:
 *           type: boolean
 *           example: true
 *         validFrom:
 *           type: string
 *           format: date-time
 *           example: 2026-01-01T00:00:00.000Z
 *         validTo:
 *           type: string
 *           format: date-time
 *           example: 2026-12-31T23:59:59.999Z
 *     PriceListResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         isDefault:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         validFrom:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         validTo:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         ruleCount:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

router.use(verifyJWT);

/**
 * @swagger
 * /api/price-lists:
 *   post:
 *     summary: Create price list
 *     description: Admin and vendor can create price lists. If isDefault is true, previous default price list is unset.
 *     tags: [Price Lists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PriceListInput'
 *     responses:
 *       201:
 *         description: Price list created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Price list name already exists
 */
router.post("/", requireRole(["ADMIN", "VENDOR"]), createPriceList);

/**
 * @swagger
 * /api/price-lists:
 *   get:
 *     summary: List price lists
 *     description: Admin, vendor, and customer can read price lists.
 *     tags: [Price Lists]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, validFrom, validTo, createdAt, updatedAt, isDefault, isActive]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Price lists fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", getPriceLists);

/**
 * @swagger
 * /api/price-lists/{id}:
 *   get:
 *     summary: Get price list by id
 *     tags: [Price Lists]
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
 *         description: Price list fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Price list not found
 */
router.get("/:id", getPriceList);

/**
 * @swagger
 * /api/price-lists/{id}:
 *   put:
 *     summary: Update price list
 *     description: Admin and vendor can update price lists. If isDefault is true, previous default price list is unset.
 *     tags: [Price Lists]
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
 *             $ref: '#/components/schemas/PriceListInput'
 *     responses:
 *       200:
 *         description: Price list updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Price list not found
 *       409:
 *         description: Price list name already exists
 */
router.put("/:id", requireRole(["ADMIN", "VENDOR"]), updatePriceList);

/**
 * @swagger
 * /api/price-lists/{id}:
 *   delete:
 *     summary: Delete price list
 *     description: Admin and vendor can delete price lists only when no price list rules exist.
 *     tags: [Price Lists]
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
 *         description: Price list deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Price list not found
 *       409:
 *         description: Price list contains rules
 */
router.delete("/:id", requireRole(["ADMIN", "VENDOR"]), deletePriceList);

export default router;
