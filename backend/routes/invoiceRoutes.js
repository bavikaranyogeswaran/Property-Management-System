import { Router } from 'express';
import invoiceController from '../controllers/invoiceController.js';
import {
  authenticateToken,
  authorizeResource,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

const router = Router();

/**
 * @openapi
 * /api/invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: List invoices visible to the caller
 *     description: Tenants see their own; staff see invoices on their scoped properties.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: leaseId
 *         in: query
 *         schema: { type: integer }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [pending, partially_paid, paid, overdue, void] }
 *       - name: invoiceType
 *         in: query
 *         schema: { type: string, enum: [rent, maintenance, late_fee, deposit, other] }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Invoices.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Invoice' }
 *   post:
 *     tags: [Invoices]
 *     summary: Create an invoice manually (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/InvoiceCreateRequest' }
 *     responses:
 *       201:
 *         description: Invoice created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Invoice' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.get('/', authenticateToken, invoiceController.getInvoices);
router.post(
  '/',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  invoiceController.createInvoice
);

/**
 * @openapi
 * /api/invoices/generate:
 *   post:
 *     tags: [Invoices]
 *     summary: Bulk-generate monthly rent invoices for active leases (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year: { type: integer, example: 2026 }
 *               month: { type: integer, minimum: 1, maximum: 12 }
 *               propertyId: { type: integer, nullable: true }
 *     responses:
 *       200:
 *         description: Generation summary.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 created: { type: integer, example: 24 }
 *                 skipped: { type: integer, example: 1 }
 */
router.post(
  '/generate',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  invoiceController.generateMonthlyInvoices
);

/**
 * @openapi
 * /api/invoices/{id}/status:
 *   patch:
 *     tags: [Invoices]
 *     summary: Update invoice status manually (with authorization on the invoice)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, partially_paid, paid, overdue, void] }
 *     responses:
 *       200:
 *         description: Status updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Invoice' }
 */
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeResource('invoice', 'id', 'params'),
  invoiceController.updateStatus
);

/**
 * @openapi
 * /api/invoices/{id}/correct:
 *   post:
 *     tags: [Invoices]
 *     summary: Issue a correction (void original + new invoice) — staff with access to the invoice
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, reason]
 *             properties:
 *               amount: { type: integer, minimum: 0 }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Correction posted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 voidedInvoice: { $ref: '#/components/schemas/Invoice' }
 *                 newInvoice: { $ref: '#/components/schemas/Invoice' }
 */
router.post(
  '/:id/correct',
  authenticateToken,
  authorizeResource('invoice', 'id', 'params'),
  invoiceController.correctInvoice
);

export default router;
