import { Router } from 'express';
import propertyTypeController from '../controllers/propertyTypeController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/property-types:
 *   get:
 *     tags: [Property Types]
 *     summary: List property types
 *     security: []
 *     responses:
 *       200:
 *         description: Property type list.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/PropertyType' }
 *   post:
 *     tags: [Property Types]
 *     summary: Create a property type (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PropertyType' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/', propertyTypeController.getAllPropertyTypes);

/**
 * @openapi
 * /api/property-types/{id}:
 *   get:
 *     tags: [Property Types]
 *     summary: Get a property type
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Property type.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PropertyType' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Property Types]
 *     summary: Update a property type (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PropertyType' }
 *   delete:
 *     tags: [Property Types]
 *     summary: Delete a property type (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Deleted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.get('/:id', propertyTypeController.getPropertyTypeById);
router.post(
  '/',
  authenticateToken,
  authorizeRoles('owner'),
  propertyTypeController.createPropertyType
);
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'),
  propertyTypeController.updatePropertyType
);
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'),
  propertyTypeController.deletePropertyType
);

export default router;
