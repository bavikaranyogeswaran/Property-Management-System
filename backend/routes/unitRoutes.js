import { Router } from 'express';
import unitController from '../controllers/unitController.js';
import {
  authenticateToken,
  authorizeRoles,
  authorizeResource,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

const router = Router();

/**
 * @openapi
 * /api/units:
 *   get:
 *     tags: [Units]
 *     summary: List units (filterable by property/status)
 *     security: []
 *     parameters:
 *       - name: propertyId
 *         in: query
 *         schema: { type: integer }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [available, occupied, maintenance, reserved, inactive] }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Unit list.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Unit' }
 *   post:
 *     tags: [Units]
 *     summary: Create a unit (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UnitCreateRequest' }
 *     responses:
 *       201:
 *         description: Unit created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Unit' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.get('/', unitController.getUnits);

/**
 * @openapi
 * /api/units/{id}:
 *   get:
 *     tags: [Units]
 *     summary: Get a unit by ID
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Unit detail.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Unit' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Units]
 *     summary: Update a unit (Owner with ownership check)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unitNumber: { type: string }
 *               unitTypeId: { type: integer }
 *               monthlyRent: { type: integer }
 *               status: { type: string, enum: [available, occupied, maintenance, reserved, inactive] }
 *     responses:
 *       200:
 *         description: Unit updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Unit' }
 *   delete:
 *     tags: [Units]
 *     summary: Archive a unit (Owner with ownership check)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Unit archived.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.get('/:id', unitController.getUnitById);
router.post(
  '/',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  unitController.createUnit
);
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  authorizeResource('unit', 'id', 'params'),
  unitController.updateUnit
);
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  authorizeResource('unit', 'id', 'params'),
  unitController.deleteUnit
);

/**
 * @openapi
 * /api/units/{id}/mark-available:
 *   patch:
 *     tags: [Units]
 *     summary: Mark a maintenance unit as available again (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Unit set to `available`.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Unit' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.patch(
  '/:id/mark-available',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('unit', 'id', 'params'),
  unitController.markAvailable
);

/**
 * @openapi
 * /api/units/{id}/clear-turnover:
 *   patch:
 *     tags: [Units]
 *     summary: Mark unit turnover (cleaning / inspection) as cleared
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Turnover cleared.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Unit' }
 */
router.patch(
  '/:id/clear-turnover',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  unitController.clearTurnover
);

export default router;
