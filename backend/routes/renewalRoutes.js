import { Router } from 'express';
import renewalController from '../controllers/renewalController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';
import validateRequest from '../middleware/validateRequest.js';
import { proposeTermsSchema } from '../schemas/renewalSchemas.js';

const router = Router();

/**
 * @openapi
 * /api/renewal-requests:
 *   get:
 *     tags: [Renewals]
 *     summary: List renewal requests visible to the caller
 *     description: Tenants see their own; owners/treasurers see those for their properties.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [pending, negotiating, approved, rejected, cancelled] }
 *     responses:
 *       200:
 *         description: Renewal requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/RenewalRequest' }
 */
router.get('/', authenticateToken, renewalController.getRequests);

/**
 * @openapi
 * /api/renewal-requests/{id}/propose:
 *   post:
 *     tags: [Renewals]
 *     summary: Owner / Treasurer propose new lease terms
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProposeTermsRequest' }
 *     responses:
 *       200:
 *         description: Proposal recorded; tenant is notified.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RenewalRequest' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post(
  '/:id/propose',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  validateRequest(proposeTermsSchema),
  renewalController.proposeTerms
);

/**
 * @openapi
 * /api/renewal-requests/{id}/accept:
 *   post:
 *     tags: [Renewals]
 *     summary: Tenant accepts the proposed terms
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Acceptance recorded; awaits staff approval.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RenewalRequest' }
 */
router.post('/:id/accept', authenticateToken, renewalController.tenantAccept);

/**
 * @openapi
 * /api/renewal-requests/{id}/decline:
 *   post:
 *     tags: [Renewals]
 *     summary: Tenant declines the proposed terms
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               counterMonthlyRent: { type: integer, nullable: true }
 *               counterEndDate: { type: string, format: date, nullable: true }
 *               notes: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Decline recorded (with optional counter-offer).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RenewalRequest' }
 */
router.post('/:id/decline', authenticateToken, renewalController.tenantDecline);

/**
 * @openapi
 * /api/renewal-requests/{id}/approve:
 *   post:
 *     tags: [Renewals]
 *     summary: Final approval of an accepted renewal (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Renewal approved; a new lease/extension is created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RenewalRequest' }
 */
router.post(
  '/:id/approve',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  renewalController.approveRenewal
);

/**
 * @openapi
 * /api/renewal-requests/{id}/reject:
 *   post:
 *     tags: [Renewals]
 *     summary: Reject a renewal request (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Renewal rejected.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RenewalRequest' }
 */
router.post(
  '/:id/reject',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  renewalController.rejectRenewal
);

export default router;
