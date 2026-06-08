import express from 'express';
import adminController from '../controllers/adminController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

const router = express.Router();

/**
 * @openapi
 * /api/admin/trigger-late-fees:
 *   post:
 *     tags: [Admin]
 *     summary: Manually trigger the late-fee automation pass
 *     description: |
 *       Forces an immediate run of the late-fee job that would otherwise execute via the
 *       nightly cron. Useful for backfills or after migrations. Restricted to Owners and Treasurers.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Late-fee job ran. Returns a summary of created/updated invoices.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 processed: { type: integer, example: 12 }
 *                 created: { type: integer, example: 3 }
 *                 details: { type: array, items: { type: object } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post(
  '/trigger-late-fees',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  adminController.triggerLateFees
);

export default router;
