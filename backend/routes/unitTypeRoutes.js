import { Router } from 'express';
import unitTypeController from '../controllers/unitTypeController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/unit-types:
 *   get:
 *     tags: [Unit Types]
 *     summary: List unit types
 *     security: []
 *     responses:
 *       200:
 *         description: Unit types.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/UnitType' }
 *   post:
 *     tags: [Unit Types]
 *     summary: Create a unit type (Owner only)
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
 *             schema: { $ref: '#/components/schemas/UnitType' }
 */
router.get('/', unitTypeController.getAllUnitTypes);

/**
 * @openapi
 * /api/unit-types/{id}:
 *   get:
 *     tags: [Unit Types]
 *     summary: Get a unit type
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Unit type.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UnitType' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Unit Types]
 *     summary: Update a unit type (Owner only)
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
 *       200: { description: Updated, content: { application/json: { schema: { $ref: '#/components/schemas/UnitType' } } } }
 *   delete:
 *     tags: [Unit Types]
 *     summary: Delete a unit type (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200: { description: Deleted, content: { application/json: { schema: { $ref: '#/components/schemas/SuccessMessage' } } } }
 */
router.get('/:id', unitTypeController.getUnitTypeById);
router.post(
  '/',
  authenticateToken,
  authorizeRoles('owner'),
  unitTypeController.createUnitType
);
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'),
  unitTypeController.updateUnitType
);
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('owner'),
  unitTypeController.deleteUnitType
);

export default router;
