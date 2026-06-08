import express from 'express';
import stripeController from '../controllers/stripeController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/stripe/checkout:
 *   post:
 *     tags: [Stripe]
 *     summary: Create a Stripe Checkout Session for an invoice (Tenant)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/StripeCheckoutRequest' }
 *     responses:
 *       200:
 *         description: Hosted checkout URL.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/StripeCheckoutResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       402:
 *         description: Stripe is not configured or the invoice cannot be paid online.
 */
router.post(
  '/checkout',
  authenticateToken,
  stripeController.createCheckoutSession
);

/**
 * @openapi
 * /api/stripe/checkout/public/{token}:
 *   get:
 *     tags: [Stripe]
 *     summary: Create a public Stripe Checkout Session via guest magic token
 *     security:
 *       - guestInvoiceToken: []
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Hosted checkout URL.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/StripeCheckoutResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  '/checkout/public/:token',
  stripeController.createPublicCheckoutSession
);

/**
 * @openapi
 * /api/stripe/webhook:
 *   post:
 *     tags: [Stripe]
 *     summary: Stripe webhook handler
 *     description: |
 *       Receives Stripe events (signed via `Stripe-Signature` header) and reconciles
 *       payment/invoice/payout state. Requires the raw request body for signature verification.
 *     security: []
 *     parameters:
 *       - name: Stripe-Signature
 *         in: header
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe Event payload.
 *     responses:
 *       200:
 *         description: Event accepted.
 *       400:
 *         description: Signature verification failed.
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeController.handleWebhook
);

export default router;
