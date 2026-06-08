import { Router } from 'express';
import auditController from '../controllers/auditController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

const router = Router();

/**
 * @openapi
 * /api/audit-logs:
 *   get:
 *     tags: [Audit]
 *     summary: Fetch system audit logs (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: actionType
 *         in: query
 *         schema: { type: string }
 *       - name: userId
 *         in: query
 *         schema: { type: integer }
 *       - name: startDate
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: endDate
 *         in: query
 *         schema: { type: string, format: date }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Audit log entries.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/SystemAuditLog' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  auditController.getLogs
);

export default router;
