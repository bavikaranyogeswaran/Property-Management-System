import { Router } from 'express';
import maintenanceCostController from '../controllers/maintenanceCostController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

import validateRequest from '../middleware/validateRequest.js';
import { addMaintenanceCostSchema } from '../schemas/maintenanceCostSchemas.js';

const router = Router();

/**
 * @openapi
 * /api/maintenance-costs:
 *   post:
 *     tags: [Maintenance]
 *     summary: Record a maintenance cost against a request (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MaintenanceCostCreateRequest' }
 *     responses:
 *       201:
 *         description: Cost recorded.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MaintenanceCost' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *   get:
 *     tags: [Maintenance]
 *     summary: List maintenance costs visible to the caller
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: requestId
 *         in: query
 *         schema: { type: integer }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [active, voided] }
 *     responses:
 *       200:
 *         description: Costs.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/MaintenanceCost' }
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  validateRequest(addMaintenanceCostSchema),
  maintenanceCostController.addCost
);
router.get(
  '/',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER, ROLES.TENANT),
  maintenanceCostController.getCosts
);

/**
 * @openapi
 * /api/maintenance-costs/{id}:
 *   delete:
 *     tags: [Maintenance]
 *     summary: Void a maintenance cost (Owner / Treasurer)
 *     description: Cannot delete costs already attached to a finalized payout.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Cost voided.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  maintenanceCostController.deleteCost
);

export default router;
