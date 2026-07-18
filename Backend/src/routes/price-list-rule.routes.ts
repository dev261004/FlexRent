import { Router } from "express";
import {
  deletePriceListRule,
  getPriceListRule,
  updatePriceListRule,
} from "../controllers/price-list-rule.controller";
import { requireRole, verifyJWT } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyJWT);

/**
 * @swagger
 * /api/price-list-rules/{id}:
 *   get:
 *     summary: Get price list rule by id
 *     tags: [Price List Rules]
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
 *         description: Price list rule fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Price list rule not found
 */
router.get("/:id", getPriceListRule);

/**
 * @swagger
 * /api/price-list-rules/{id}:
 *   put:
 *     summary: Update price list rule
 *     tags: [Price List Rules]
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
 *             $ref: '#/components/schemas/PriceListRuleInput'
 *     responses:
 *       200:
 *         description: Price list rule updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Price list rule, product, or category not found
 */
router.put("/:id", requireRole(["ADMIN", "VENDOR"]), updatePriceListRule);

/**
 * @swagger
 * /api/price-list-rules/{id}:
 *   delete:
 *     summary: Delete price list rule
 *     tags: [Price List Rules]
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
 *         description: Price list rule deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Price list rule not found
 */
router.delete("/:id", requireRole(["ADMIN", "VENDOR"]), deletePriceListRule);

export default router;
