import { Router } from "express";
import {
  createProductAttribute,
  deleteProductAttribute,
  getProductAttributeById,
  listProductAttributes,
  updateProductAttribute,
} from "../controllers/product-attribute.controller";
import { requireRole, verifyJWT } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Product Attributes
 *   description: Product attribute APIs
 *
 * components:
 *   schemas:
 *     ProductAttributeInput:
 *       type: object
 *       required:
 *         - name
 *         - displayType
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Color
 *         displayType:
 *           type: string
 *           enum: [RADIO, PILLS, CHECKBOX, IMAGE]
 *           example: PILLS
 *         isActive:
 *           type: boolean
 *           example: true
 *     ProductAttribute:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *           example: Color
 *         slug:
 *           type: string
 *           example: color
 *         displayType:
 *           type: string
 *           enum: [RADIO, PILLS, CHECKBOX, IMAGE]
 *         isActive:
 *           type: boolean
 *         valueCount:
 *           type: integer
 *         productCount:
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
 * /api/product-attributes:
 *   post:
 *     summary: Create product attribute
 *     tags: [Product Attributes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductAttributeInput'
 *     responses:
 *       201:
 *         description: Product attribute created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Attribute name already exists
 */
router.post("/", requireRole(["ADMIN"]), createProductAttribute);

/**
 * @swagger
 * /api/product-attributes:
 *   get:
 *     summary: List product attributes
 *     tags: [Product Attributes]
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, displayType, createdAt, updatedAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Product attributes fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", listProductAttributes);

/**
 * @swagger
 * /api/product-attributes/{id}:
 *   get:
 *     summary: Get product attribute by id
 *     tags: [Product Attributes]
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
 *         description: Product attribute fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product attribute not found
 */
router.get("/:id", getProductAttributeById);

/**
 * @swagger
 * /api/product-attributes/{id}:
 *   put:
 *     summary: Update product attribute
 *     tags: [Product Attributes]
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
 *             $ref: '#/components/schemas/ProductAttributeInput'
 *     responses:
 *       200:
 *         description: Product attribute updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Product attribute not found
 *       409:
 *         description: Attribute name already exists
 */
router.put("/:id", requireRole(["ADMIN"]), updateProductAttribute);

/**
 * @swagger
 * /api/product-attributes/{id}:
 *   delete:
 *     summary: Delete product attribute
 *     description: Attribute cannot be deleted if it is linked with products or variants.
 *     tags: [Product Attributes]
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
 *         description: Product attribute deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Product attribute not found
 *       409:
 *         description: Attribute is linked with products or variants
 */
router.delete("/:id", requireRole(["ADMIN"]), deleteProductAttribute);

export default router;
