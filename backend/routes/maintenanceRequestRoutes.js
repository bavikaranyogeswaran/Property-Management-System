import { Router } from 'express';
import maintenanceRequestController from '../controllers/maintenanceRequestController.js';
import {
  authenticateToken,
  authorizeResource,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

import upload from '../middleware/upload.js';

const router = Router();

/**
 * @openapi
 * /api/maintenance-requests:
 *   post:
 *     tags: [Maintenance]
 *     summary: Tenant submits a new maintenance request (multipart with optional images)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/MaintenanceCreateRequest' }
 *     responses:
 *       201:
 *         description: Request submitted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MaintenanceRequest' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *   get:
 *     tags: [Maintenance]
 *     summary: List maintenance requests visible to the caller
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [submitted, in_progress, completed, closed] }
 *       - name: unitId
 *         in: query
 *         schema: { type: integer }
 *       - name: propertyId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/MaintenanceRequest' }
 */
router.post(
  '/',
  authenticateToken,
  upload.array('images', 5),
  maintenanceRequestController.createRequest
);
router.get('/', authenticateToken, maintenanceRequestController.getRequests);

/**
 * @openapi
 * /api/maintenance-requests/{id}/status:
 *   put:
 *     tags: [Maintenance]
 *     summary: Update a maintenance request's status / ETA
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [submitted, in_progress, completed, closed] }
 *               etaNotes: { type: string }
 *     responses:
 *       200:
 *         description: Updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MaintenanceRequest' }
 */
router.put(
  '/:id/status',
  authenticateToken,
  authorizeResource('maintenance_request', 'id', 'params'),
  maintenanceRequestController.updateStatus
);

/**
 * @openapi
 * /api/maintenance-requests/invoice:
 *   post:
 *     tags: [Maintenance]
 *     summary: Generate a tenant-billable invoice from a maintenance request (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestId, amount]
 *             properties:
 *               requestId: { type: integer }
 *               amount: { type: integer, minimum: 0 }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Maintenance invoice created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Invoice' }
 */
router.post(
  '/invoice',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  maintenanceRequestController.createInvoice
);

export default router;
