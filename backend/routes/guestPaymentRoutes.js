import { Router } from 'express';
import guestPaymentController from '../controllers/guestPaymentController.js';
import upload from '../middleware/upload.js';
import {
  guestApiLimiter,
  guestSubmitLimiter,
} from '../middleware/guestLimiter.js';

const router = Router();

// [S6 FIX] Defense-in-depth: Prevent magic token leakage via Referer headers.
router.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

router.use(guestApiLimiter);

/**
 * @openapi
 * /api/public/invoice/{token}:
 *   get:
 *     tags: [Guest Payments]
 *     summary: Retrieve invoice details for a guest using a magic token
 *     security:
 *       - guestInvoiceToken: []
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoice + lease + property snapshot.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GuestInvoice' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.get('/:token', guestPaymentController.getInvoiceDetails);

/**
 * @openapi
 * /api/public/invoice/{token}/submit:
 *   post:
 *     tags: [Guest Payments]
 *     summary: Submit a guest payment (multipart with optional proof file)
 *     security:
 *       - guestInvoiceToken: []
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [amount, paymentDate, paymentMethod]
 *             properties:
 *               amount: { type: number, minimum: 0 }
 *               paymentDate: { type: string, format: date }
 *               paymentMethod: { type: string }
 *               referenceNumber: { type: string }
 *               proof: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Submission accepted; polling status begins.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentId: { type: integer }
 *                 status: { type: string }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.post(
  '/:token/submit',
  guestSubmitLimiter,
  upload.single('proof'),
  guestPaymentController.submitPayment
);

/**
 * @openapi
 * /api/public/invoice/{token}/status:
 *   get:
 *     tags: [Guest Payments]
 *     summary: Poll guest payment status (for activation success)
 *     security:
 *       - guestInvoiceToken: []
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Latest activation status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, enum: [pending, verified, rejected, activated] }
 *                 activatedAt: { type: string, format: date-time, nullable: true }
 */
router.get('/:token/status', guestPaymentController.getActivationStatus);

/**
 * @openapi
 * /api/public/invoice/{token}/onboarding-status:
 *   get:
 *     tags: [Guest Payments]
 *     summary: Get comprehensive onboarding funnel status for the guest
 *     security:
 *       - guestInvoiceToken: []
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Funnel snapshot.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceStatus: { type: string }
 *                 paymentStatus: { type: string }
 *                 accountStatus: { type: string }
 *                 leaseStatus: { type: string }
 */
router.get('/:token/onboarding-status', guestPaymentController.getStatus);

/**
 * @openapi
 * /api/public/invoice/checkout-status/{orderId}:
 *   get:
 *     tags: [Guest Payments]
 *     summary: Poll guest checkout status by PayHere/Stripe order ID
 *     security: []
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Latest checkout status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 paymentId: { type: integer, nullable: true }
 */
router.get(
  '/checkout-status/:orderId',
  guestPaymentController.getActivationStatusByOrder
);

export default router;
