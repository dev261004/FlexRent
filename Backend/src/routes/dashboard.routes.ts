import { Router } from "express";
import { getRentalOperationsDashboard } from "../controllers/dashboard.controller";
import { requireRole, verifyJWT } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Rental operations dashboard APIs
 */

router.use(verifyJWT);

/**
 * @swagger
 * /api/dashboard/rental-operations:
 *   get:
 *     summary: Get rental operations dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [today, this_week, this_month, custom]
 *           default: today
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
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rental operations dashboard fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/rental-operations",
  requireRole(["ADMIN", "VENDOR"]),
  getRentalOperationsDashboard
);

export default router;
