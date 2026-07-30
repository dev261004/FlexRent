import { Router } from "express";
import { requireRole, verifyJWT } from "../middleware/auth.middleware";
import {
  getOverdueByRentalId,
  getOverdueStatistics,
  ignoreOverdue,
  listOverdueRecords,
  resolveOverdue,
  runOverdueDetection,
} from "./overdue.controller";

const router = Router();

// All overdue endpoints require authentication
router.use(verifyJWT);

/**
 * @openapi
 * /api/overdue:
 *   get:
 *     summary: List overdue records
 *     description: Retrieve a paginated list of overdue records with optional filtering by status, vendor, or customer.
 *     tags:
 *       - Overdue Engine
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, RESOLVED, IGNORED]
 *         description: Overdue status filter
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *         description: Vendor ID filter
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for rental order ID or user email
 *     responses:
 *       200:
 *         description: Overdue records list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", listOverdueRecords);

/**
 * @openapi
 * /api/overdue/statistics:
 *   get:
 *     summary: Get overdue dashboard statistics
 *     description: Retrieve metrics on total, active, resolved, ignored overdue rentals and average overdue days.
 *     tags:
 *       - Overdue Engine
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/statistics", getOverdueStatistics);

/**
 * @openapi
 * /api/overdue/run:
 *   post:
 *     summary: Run overdue detection manually
 *     description: Manually trigger the overdue detection engine to scan picked-up rentals and create overdue records.
 *     tags:
 *       - Overdue Engine
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue detection execution summary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Vendor access required
 */
router.post("/run", requireRole(["ADMIN", "VENDOR"]), runOverdueDetection);

/**
 * @openapi
 * /api/overdue/{rentalOrderId}:
 *   get:
 *     summary: Get single overdue record
 *     description: Fetch overdue details for a specific rental order by rentalOrderId.
 *     tags:
 *       - Overdue Engine
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rentalOrderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Rental order ID
 *     responses:
 *       200:
 *         description: Overdue record details
 *       404:
 *         description: Overdue record not found
 */
router.get("/:rentalOrderId", getOverdueByRentalId);

/**
 * @openapi
 * /api/overdue/{id}/ignore:
 *   patch:
 *     summary: Ignore an overdue record
 *     description: Manually mark an overdue record as IGNORED (Admin / Vendor action).
 *     tags:
 *       - Overdue Engine
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Overdue record ID
 *     responses:
 *       200:
 *         description: Record marked as IGNORED
 *       404:
 *         description: Record not found
 */
router.patch("/:id/ignore", requireRole(["ADMIN", "VENDOR"]), ignoreOverdue);

/**
 * @openapi
 * /api/overdue/{id}/resolve:
 *   patch:
 *     summary: Resolve an overdue record
 *     description: Manually mark an active overdue record as RESOLVED.
 *     tags:
 *       - Overdue Engine
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Overdue record ID
 *     responses:
 *       200:
 *         description: Record marked as RESOLVED
 *       404:
 *         description: Record not found
 */
router.patch("/:id/resolve", requireRole(["ADMIN", "VENDOR"]), resolveOverdue);

export default router;
