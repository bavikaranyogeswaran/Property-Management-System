import express from 'express';
import systemController from '../controllers/systemController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

const router = express.Router();

/**
 * @openapi
 * /api/system/cron-logs:
 *   get:
 *     tags: [System]
 *     summary: List cron checkpoint logs (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Cron checkpoints.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   job_name: { type: string }
 *                   last_success_date: { type: string, format: date }
 *                   status: { type: string, enum: [success, failed] }
 *                   message: { type: string, nullable: true }
 *                   updated_at: { type: string, format: date-time }
 */
router.get(
  '/cron-logs',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  systemController.getCronLogs
);

/**
 * @openapi
 * /api/system/cron-run:
 *   post:
 *     tags: [System]
 *     summary: Trigger a cron job manually (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobName]
 *             properties:
 *               jobName:
 *                 type: string
 *                 example: late_fee_check
 *     responses:
 *       200:
 *         description: Cron job executed; returns a summary of the run.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 jobName: { type: string }
 *                 result: { type: object, additionalProperties: true }
 */
router.post(
  '/cron-run',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  systemController.triggerCron
);

export default router;
