import { Router } from 'express';
import paymentController from '../controllers/paymentController.js';

import {
  authenticateToken,
  authorizeRoles,
  authorizeResource,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

import validateRequest from '../middleware/validateRequest.js';
import {
  submitPaymentSchema,
  verifyPaymentSchema,
} from '../schemas/paymentSchemas.js';
import idempotencyMiddleware from '../middleware/idempotencyMiddleware.js';

const router = Router();

import upload from '../middleware/upload.js';

/**
 * @openapi
 * /api/payments:
 *   post:
 *     tags: [Payments]
 *     summary: Tenant submits a payment for an invoice
 *     description: |
 *       Idempotent: clients must supply an `Idempotency-Key` header. The optional `proof`
 *       multipart field uploads a receipt image/PDF to Cloudinary; the URL is also accepted
 *       directly as `evidenceUrl`.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: Idempotency-Key
 *         in: header
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/PaymentSubmitRequest' }
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PaymentSubmitRequest' }
 *     responses:
 *       201:
 *         description: Payment submitted; awaits verification.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Payment' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *   get:
 *     tags: [Payments]
 *     summary: List payments visible to the caller
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: invoiceId
 *         in: query
 *         schema: { type: integer }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [pending, verified, rejected] }
 *     responses:
 *       200:
 *         description: Payments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Payment' }
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles(ROLES.TENANT),
  upload.single('proof'),
  idempotencyMiddleware(),
  validateRequest(submitPaymentSchema),
  paymentController.submitPayment
);

router.get('/', authenticateToken, paymentController.getPayments);

/**
 * @openapi
 * /api/payments/{id}/verify:
 *   put:
 *     tags: [Payments]
 *     summary: Verify or reject a tenant-submitted payment (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VerifyPaymentRequest' }
 *     responses:
 *       200:
 *         description: Payment verified or rejected; ledger entries are posted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Payment' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put(
  '/:id/verify',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('payment', 'id', 'params'),
  validateRequest(verifyPaymentSchema),
  paymentController.verifyPayment
);

export default router;
