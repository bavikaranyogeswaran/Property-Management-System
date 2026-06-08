import express from 'express';
import payoutController from '../controllers/payoutController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import idempotencyMiddleware from '../middleware/idempotencyMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

const router = express.Router();

/**
 * @openapi
 * /api/payouts/preview:
 *   get:
 *     tags: [Payouts]
 *     summary: Preview a payout (Treasurer only)
 *     description: Computes the gross/commission/expense/net figures for an owner and period without persisting anything.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: ownerId
 *         in: query
 *         required: true
 *         schema: { type: integer }
 *       - name: periodStart
 *         in: query
 *         required: true
 *         schema: { type: string, format: date }
 *       - name: periodEnd
 *         in: query
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Preview figures.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 grossAmount: { type: integer }
 *                 commissionAmount: { type: integer }
 *                 expensesAmount: { type: integer }
 *                 netAmount: { type: integer }
 *                 includedPayments:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Payment' }
 */
router.get(
  '/preview',
  authenticateToken,
  authorizeRoles(ROLES.TREASURER),
  payoutController.previewPayout
);

/**
 * @openapi
 * /api/payouts/create:
 *   post:
 *     tags: [Payouts]
 *     summary: Generate a payout (Treasurer only)
 *     description: Idempotent — supply `Idempotency-Key` header.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: Idempotency-Key
 *         in: header
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ownerId, periodStart, periodEnd]
 *             properties:
 *               ownerId: { type: integer }
 *               periodStart: { type: string, format: date }
 *               periodEnd: { type: string, format: date }
 *               bankReference: { type: string, nullable: true }
 *               proofUrl: { type: string, format: uri, nullable: true }
 *     responses:
 *       201:
 *         description: Payout created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Payout' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post(
  '/create',
  authenticateToken,
  authorizeRoles(ROLES.TREASURER),
  idempotencyMiddleware(),
  payoutController.createPayout
);

/**
 * @openapi
 * /api/payouts/history:
 *   get:
 *     tags: [Payouts]
 *     summary: List payouts (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: ownerId
 *         in: query
 *         schema: { type: integer }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [pending, paid, acknowledged, disputed] }
 *     responses:
 *       200:
 *         description: Payout history.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Payout' }
 */
router.get(
  '/history',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  payoutController.getHistory
);

/**
 * @openapi
 * /api/payouts/{id}/paid:
 *   put:
 *     tags: [Payouts]
 *     summary: Mark a payout as paid (Treasurer only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bankReference: { type: string }
 *               proofUrl: { type: string, format: uri }
 *     responses:
 *       200:
 *         description: Payout marked paid.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Payout' }
 */
router.put(
  '/:id/paid',
  authenticateToken,
  authorizeRoles(ROLES.TREASURER),
  payoutController.markAsPaid
);

/**
 * @openapi
 * /api/payouts/{id}/acknowledge:
 *   put:
 *     tags: [Payouts]
 *     summary: Owner acknowledges receipt of a payout
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Acknowledged.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Payout' }
 */
router.put(
  '/:id/acknowledge',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  payoutController.acknowledgePayout
);

/**
 * @openapi
 * /api/payouts/{id}/dispute:
 *   put:
 *     tags: [Payouts]
 *     summary: Owner disputes a payout
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Dispute opened.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Payout' }
 */
router.put(
  '/:id/dispute',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  payoutController.disputePayout
);

/**
 * @openapi
 * /api/payouts/{id}/details:
 *   get:
 *     tags: [Payouts]
 *     summary: Get detailed payout breakdown (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Payout details with included payments and expenses.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Payout'
 *                 - type: object
 *                   properties:
 *                     payments:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Payment' }
 *                     expenses:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/MaintenanceCost' }
 */
router.get(
  '/:id/details',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  payoutController.getPayoutDetails
);

/**
 * @openapi
 * /api/payouts/{id}/export:
 *   get:
 *     tags: [Payouts]
 *     summary: Export a payout as CSV (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: CSV export.
 *         content:
 *           text/csv:
 *             schema: { type: string }
 */
router.get(
  '/:id/export',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  payoutController.exportPayoutCSV
);

export default router;
