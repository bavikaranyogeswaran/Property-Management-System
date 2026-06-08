import { Router } from 'express';
import leaseController from '../controllers/leaseController.js';
import {
  authenticateToken,
  authorizeRoles,
  authorizeResource,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

const router = Router();

/**
 * @openapi
 * /api/leases:
 *   get:
 *     tags: [Leases]
 *     summary: List leases (scoped by caller role)
 *     description: Owners see leases on their properties; treasurers see leases on assigned properties; tenants see only their own.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [draft, pending, active, expired, ended, cancelled] }
 *       - name: tenantId
 *         in: query
 *         schema: { type: integer }
 *       - name: unitId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Leases.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Lease' }
 *   post:
 *     tags: [Leases]
 *     summary: Create a new lease (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LeaseCreateRequest' }
 *     responses:
 *       201:
 *         description: Lease created (status `draft` or `pending`).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER, ROLES.TENANT),
  leaseController.getLeases
);
router.post(
  '/',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  leaseController.createLease
);

/**
 * @openapi
 * /api/leases/{id}:
 *   get:
 *     tags: [Leases]
 *     summary: Get a lease by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Lease detail.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Leases]
 *     summary: Cancel a lease in draft/pending state (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Lease cancelled.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       409:
 *         description: Lease cannot be cancelled in its current state.
 */
router.get(
  '/:id',
  authenticateToken,
  authorizeResource('lease', 'id', 'params'),
  leaseController.getLeaseById
);

/**
 * @openapi
 * /api/leases/{id}/instant-renew:
 *   post:
 *     tags: [Leases]
 *     summary: Instantly renew a lease at current terms (Owner / Treasurer)
 *     description: Short-circuits the renewal negotiation workflow when both parties accept renewing as-is.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newEndDate: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lease renewed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.post(
  '/:id/instant-renew',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('lease', 'id', 'params'),
  leaseController.instantRenew
);

/**
 * @openapi
 * /api/leases/{id}/refund:
 *   post:
 *     tags: [Leases]
 *     summary: Propose a deposit refund amount (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [proposedRefundAmount]
 *             properties:
 *               proposedRefundAmount: { type: integer, minimum: 0 }
 *               refundNotes: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Refund proposal recorded.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.post(
  '/:id/refund',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('lease', 'id', 'params'),
  leaseController.refundDeposit
);

/**
 * @openapi
 * /api/leases/{id}/refund/approve:
 *   patch:
 *     tags: [Leases]
 *     summary: Approve a treasurer-proposed refund (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Refund approved.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.patch(
  '/:id/refund/approve',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  authorizeResource('lease', 'id', 'params'),
  leaseController.approveRefund
);

/**
 * @openapi
 * /api/leases/{id}/refund/dispute:
 *   patch:
 *     tags: [Leases]
 *     summary: Mark the refund as disputed (Owner / Treasurer)
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
 *         description: Dispute recorded.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.patch(
  '/:id/refund/dispute',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('lease', 'id', 'params'),
  leaseController.disputeRefund
);

/**
 * @openapi
 * /api/leases/{id}/refund/disburse:
 *   post:
 *     tags: [Leases]
 *     summary: Record the actual refund disbursement (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: integer, minimum: 0 }
 *               bankReference: { type: string, nullable: true }
 *               proofUrl: { type: string, format: uri, nullable: true }
 *     responses:
 *       200:
 *         description: Disbursement logged.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.post(
  '/:id/refund/disburse',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('lease', 'id', 'params'),
  leaseController.recordDisbursement
);

/**
 * @openapi
 * /api/leases/{id}/refund/resolve:
 *   post:
 *     tags: [Leases]
 *     summary: Resolve a disputed refund (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               finalAmount: { type: integer }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Dispute resolved.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.post(
  '/:id/refund/resolve',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('lease', 'id', 'params'),
  leaseController.resolveRefundDispute
);

/**
 * @openapi
 * /api/leases/{id}/document:
 *   patch:
 *     tags: [Leases]
 *     summary: Attach or replace the lease document URL
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentUrl]
 *             properties:
 *               documentUrl: { type: string, format: uri }
 *     responses:
 *       200:
 *         description: Document updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.patch(
  '/:id/document',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('lease', 'id', 'params'),
  leaseController.updateLeaseDocument
);

/**
 * @openapi
 * /api/leases/{id}/terminate:
 *   post:
 *     tags: [Leases]
 *     summary: Terminate an active lease (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [terminationDate]
 *             properties:
 *               terminationDate: { type: string, format: date }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Lease terminated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.post(
  '/:id/terminate',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('lease', 'id', 'params'),
  leaseController.terminateLease
);

/**
 * @openapi
 * /api/leases/{id}/notice-status:
 *   patch:
 *     tags: [Leases]
 *     summary: Update notice intent (renewing / vacating) — tenant or staff
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [noticeStatus]
 *             properties:
 *               noticeStatus: { type: string, enum: [undecided, vacating, renewing] }
 *     responses:
 *       200:
 *         description: Notice status updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.patch(
  '/:id/notice-status',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER, ROLES.TENANT),
  authorizeResource('lease', 'id', 'params'),
  leaseController.updateNoticeStatus
);

/**
 * @openapi
 * /api/leases/{id}/adjustments:
 *   get:
 *     tags: [Leases]
 *     summary: List rent adjustments made over the lease lifetime
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Adjustment history.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/RentAdjustment' }
 *   post:
 *     tags: [Leases]
 *     summary: Record a rent adjustment (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [effectiveDate, newMonthlyRent]
 *             properties:
 *               effectiveDate: { type: string, format: date }
 *               newMonthlyRent: { type: integer, minimum: 0 }
 *               notes: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Adjustment recorded.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RentAdjustment' }
 */
router.get(
  '/:id/adjustments',
  authenticateToken,
  authorizeResource('lease', 'id', 'params'),
  leaseController.getRentAdjustments
);
router.post(
  '/:id/adjustments',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('lease', 'id', 'params'),
  leaseController.addRentAdjustment
);

/**
 * @openapi
 * /api/leases/{id}/finalize-checkout:
 *   post:
 *     tags: [Leases]
 *     summary: Finalize tenant checkout, freezing the deposit settlement workflow (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Checkout finalized.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.post(
  '/:id/finalize-checkout',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('lease', 'id', 'params'),
  leaseController.finalizeCheckout
);

/**
 * @openapi
 * /api/leases/{id}/deposit-status:
 *   get:
 *     tags: [Leases]
 *     summary: Get the deposit refund workflow state
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Deposit status snapshot.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, enum: [pending, paid, awaiting_approval, awaiting_acknowledgment, disputed, partially_refunded, refunded] }
 *                 proposedRefundAmount: { type: integer }
 *                 refundedAmount: { type: integer }
 *                 refundNotes: { type: string, nullable: true }
 */
router.get(
  '/:id/deposit-status',
  authenticateToken,
  authorizeResource('lease', 'id', 'params'),
  leaseController.getDepositStatus
);

/**
 * @openapi
 * /api/leases/{id}/acknowledge-refund:
 *   patch:
 *     tags: [Leases]
 *     summary: Tenant acknowledges receipt of the refund
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Refund acknowledged.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.patch(
  '/:id/acknowledge-refund',
  authenticateToken,
  authorizeResource('lease', 'id', 'params'),
  leaseController.acknowledgeRefund
);

/**
 * @openapi
 * /api/leases/{id}/verify-documents:
 *   patch:
 *     tags: [Leases]
 *     summary: Mark lease documents as verified (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Documents verified.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.patch(
  '/:id/verify-documents',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('lease', 'id', 'params'),
  leaseController.verifyLeaseDocuments
);

/**
 * @openapi
 * /api/leases/{id}/reject-documents:
 *   patch:
 *     tags: [Leases]
 *     summary: Reject submitted lease documents (Owner / Treasurer)
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
 *         description: Documents rejected; tenant notified.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.patch(
  '/:id/reject-documents',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('lease', 'id', 'params'),
  leaseController.rejectLeaseDocuments
);

/**
 * @openapi
 * /api/leases/{id}/withdraw:
 *   post:
 *     tags: [Leases]
 *     summary: Tenant withdraws a pending lease application
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Application withdrawn.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.post(
  '/:id/withdraw',
  authenticateToken,
  authorizeResource('lease', 'id', 'params'),
  leaseController.withdrawApplication
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('lease', 'id', 'params'),
  leaseController.cancelLease
);

/**
 * @openapi
 * /api/leases/{id}/sign:
 *   post:
 *     tags: [Leases]
 *     summary: Sign the lease (tenant or staff signature)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Lease signed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lease' }
 */
router.post(
  '/:id/sign',
  authenticateToken,
  authorizeResource('lease', 'id', 'params'),
  leaseController.signLease
);

/**
 * @openapi
 * /api/leases/{id}/regenerate-token:
 *   post:
 *     tags: [Leases]
 *     summary: Regenerate the magic token for guest payment URLs (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: A new token is issued (old one is invalidated).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 url: { type: string, format: uri }
 */
router.post(
  '/:id/regenerate-token',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  authorizeResource('lease'),
  leaseController.regenerateMagicToken
);

export default router;
