import { Router } from "express";
import {
  createQuotationTemplate,
  deleteQuotationTemplate,
  getDefaultQuotationTemplate,
  getQuotationTemplate,
  getQuotationTemplates,
  setDefaultQuotationTemplate,
  updateQuotationTemplate,
} from "../controllers/quotation-template.controller";
import { requireRole, verifyJWT } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Quotation Templates
 *     description: Quotation Template management APIs for faster quotation creation
 *
 * components:
 *   schemas:
 *     QuotationTemplateInput:
 *       type: object
 *       required:
 *         - name
 *         - header
 *         - footer
 *       properties:
 *         name:
 *           type: string
 *           example: Standard Rental Quotation
 *         header:
 *           type: string
 *           example: "FlexRent — Equipment Rental Quotation\nThank you for choosing FlexRent."
 *         footer:
 *           type: string
 *           example: "Terms: Deposit refundable on undamaged return.\nContact: support@flexrent.app"
 *         isDefault:
 *           type: boolean
 *           example: false
 *         isActive:
 *           type: boolean
 *           example: true
 *         validityDays:
 *           type: integer
 *           example: 7
 *     QuotationTemplateResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         header:
 *           type: string
 *         footer:
 *           type: string
 *         isDefault:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         validityDays:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/quotation-templates:
 *   get:
 *     summary: List quotation templates
 *     tags: [Quotation Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, header, or footer
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of quotation templates
 */
router.get("/", verifyJWT, getQuotationTemplates);

/**
 * @swagger
 * /api/quotation-templates/default:
 *   get:
 *     summary: Get default quotation template
 *     tags: [Quotation Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default quotation template
 */
router.get("/default", verifyJWT, getDefaultQuotationTemplate);

/**
 * @swagger
 * /api/quotation-templates/{id}:
 *   get:
 *     summary: Get quotation template by ID
 *     tags: [Quotation Templates]
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
 *         description: Quotation template details
 *       404:
 *         description: Quotation template not found
 */
router.get("/:id", verifyJWT, getQuotationTemplate);

/**
 * @swagger
 * /api/quotation-templates:
 *   post:
 *     summary: Create quotation template
 *     tags: [Quotation Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuotationTemplateInput'
 *     responses:
 *       201:
 *         description: Template created successfully
 *       409:
 *         description: Template with same name already exists
 */
router.post(
  "/",
  verifyJWT,
  requireRole(["ADMIN", "VENDOR"]),
  createQuotationTemplate
);

/**
 * @swagger
 * /api/quotation-templates/{id}:
 *   put:
 *     summary: Update quotation template
 *     tags: [Quotation Templates]
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
 *             $ref: '#/components/schemas/QuotationTemplateInput'
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       404:
 *         description: Template not found
 */
router.put(
  "/:id",
  verifyJWT,
  requireRole(["ADMIN", "VENDOR"]),
  updateQuotationTemplate
);
router.patch(
  "/:id",
  verifyJWT,
  requireRole(["ADMIN", "VENDOR"]),
  updateQuotationTemplate
);

/**
 * @swagger
 * /api/quotation-templates/{id}:
 *   delete:
 *     summary: Delete quotation template
 *     tags: [Quotation Templates]
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
 *         description: Template deleted successfully
 *       404:
 *         description: Template not found
 */
router.delete(
  "/:id",
  verifyJWT,
  requireRole(["ADMIN", "VENDOR"]),
  deleteQuotationTemplate
);

/**
 * @swagger
 * /api/quotation-templates/{id}/default:
 *   post:
 *     summary: Set quotation template as default
 *     tags: [Quotation Templates]
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
 *         description: Template set as default successfully
 *       404:
 *         description: Template not found
 */
router.post(
  "/:id/default",
  verifyJWT,
  requireRole(["ADMIN", "VENDOR"]),
  setDefaultQuotationTemplate
);

export default router;
