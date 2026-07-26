import { Router } from "express";
import { listRentalPeriods } from "../controllers/rental-period.controller";
import { verifyJWT } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Rental Periods
 *     description: Rental period APIs
 */

/**
 * @swagger
 * /api/rental-periods:
 *   get:
 *     summary: List all active rental periods
 *     tags: [Rental Periods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of rental periods
 */
router.get("/", verifyJWT, listRentalPeriods);

export default router;
