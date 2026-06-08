import { Router } from 'express';
import propertyController from '../controllers/propertyController.js';
import {
  authenticateToken,
  authorizeRoles,
  authorizeResource,
  optionalAuthenticateToken,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

import upload from '../middleware/upload.js';

import validateRequest from '../middleware/validateRequest.js';
import {
  propertySchema,
  updatePropertySchema,
} from '../schemas/propertySchemas.js';

const router = Router();

/**
 * @openapi
 * /api/properties/types:
 *   get:
 *     tags: [Properties]
 *     summary: List available property types (public)
 *     security: []
 *     responses:
 *       200:
 *         description: Property type lookup.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/PropertyType' }
 */
router.get('/types', propertyController.getPropertyTypes);

/**
 * @openapi
 * /api/properties:
 *   get:
 *     tags: [Properties]
 *     summary: List properties (public listing; richer details when authenticated)
 *     description: Anonymous callers receive the public marketing listing; authenticated owners/treasurers receive operationally-scoped data.
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - name: city
 *         in: query
 *         schema: { type: string }
 *       - name: district
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Property list.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/Property' } }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *   post:
 *     tags: [Properties]
 *     summary: Create a new property (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PropertyCreateRequest' }
 *     responses:
 *       201:
 *         description: Property created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Property' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/', optionalAuthenticateToken, propertyController.getProperties);
router.post(
  '/',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  validateRequest(propertySchema),
  propertyController.createProperty
);

/**
 * @openapi
 * /api/properties/{id}:
 *   get:
 *     tags: [Properties]
 *     summary: Get a property by ID (public)
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Property detail.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Property' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Properties]
 *     summary: Update a property (Owner with ownership check)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PropertyUpdateRequest' }
 *     responses:
 *       200:
 *         description: Property updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Property' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Properties]
 *     summary: Archive a property (Owner with ownership check)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Property archived.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  '/:id',
  optionalAuthenticateToken,
  propertyController.getPropertyById
);

/**
 * @openapi
 * /api/properties/{id}/lease-terms:
 *   get:
 *     tags: [Properties]
 *     summary: List the default lease terms configured for a property
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Lease terms for the property.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/LeaseTerm' }
 */
router.get('/:id/lease-terms', propertyController.getLeaseTermsByPropertyId);
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  authorizeResource('property', 'id', 'params'),
  validateRequest(updatePropertySchema),
  propertyController.updateProperty
);
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  authorizeResource('property', 'id', 'params'),
  propertyController.deleteProperty
);

/**
 * @openapi
 * /api/properties/{id}/images:
 *   post:
 *     tags: [Properties]
 *     summary: Upload up to 10 property images (Owner with ownership check)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Images uploaded.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/PropertyImage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post(
  '/:id/images',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  authorizeResource('property', 'id', 'params'),
  upload.array('images', 10),
  propertyController.uploadImages
);

export default router;
