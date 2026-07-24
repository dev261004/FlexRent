import { Router } from "express";
import { updateMyPickupSettings } from "../controllers/vendor.controller";
import { requireRole, verifyJWT } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Vendors
 *     description: Vendor configuration APIs
 *
 * /api/vendors/me/pickup-settings:
 *   put:
 *     summary: Update current vendor store pickup settings
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supportsStorePickup
 *             properties:
 *               supportsStorePickup:
 *                 type: boolean
 *               pickupAddress:
 *                 type: object
 *                 properties:
 *                   addressLine1:
 *                     type: string
 *                   addressLine2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       200:
 *         description: Pickup settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only vendors can update pickup settings
 */
router.put(
  "/me/pickup-settings",
  verifyJWT,
  requireRole(["VENDOR"]),
  updateMyPickupSettings
);

export default router;
