import express from 'express';
import {
  addBehaviorLog,
  getTenantBehavior,
  getMyBehavior,
} from '../controllers/behaviorController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

const router = express.Router();

/**
 * @openapi
 * /api/behavior/my-score:
 *   get:
 *     tags: [Behavior]
 *     summary: Tenant retrieves their own behavior score and log
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Score and history.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score: { type: integer, example: 95 }
 *                 logs:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/BehaviorLog' }
 */
router.get(
  '/my-score',
  authenticateToken,
  authorizeRoles(ROLES.TENANT),
  getMyBehavior
);

/**
 * @openapi
 * /api/behavior/{tenantId}:
 *   post:
 *     tags: [Behavior]
 *     summary: Add a behavior log entry against a tenant (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: tenantId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BehaviorCreateRequest' }
 *     responses:
 *       201:
 *         description: Behavior log added.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BehaviorLog' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *   get:
 *     tags: [Behavior]
 *     summary: Fetch a tenant's behavior score and history (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: tenantId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Tenant behavior data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score: { type: integer }
 *                 logs:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/BehaviorLog' }
 */
router.post(
  '/:tenantId',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  addBehaviorLog
);
router.get(
  '/:tenantId',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  getTenantBehavior
);

export default router;
