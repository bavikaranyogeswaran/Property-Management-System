import express from 'express';
import leadController from '../controllers/leadController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

import messageController from '../controllers/messageController.js';

const router = express.Router();

/**
 * @openapi
 * /api/leads:
 *   post:
 *     tags: [Leads]
 *     summary: Create a new lead (public)
 *     description: Used by the public website to capture inbound prospect interest. No authentication required.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LeadCreateRequest' }
 *     responses:
 *       201:
 *         description: Lead created; portal magic link emailed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lead' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *   get:
 *     tags: [Leads]
 *     summary: List leads visible to the caller (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: propertyId
 *         in: query
 *         schema: { type: integer }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [interested, converted, dropped] }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Leads.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Lead' }
 */
router.post('/', leadController.createLead);

router.use(authenticateToken);

router.get('/', leadController.getLeads);

/**
 * @openapi
 * /api/leads/stage-history:
 *   get:
 *     tags: [Leads]
 *     summary: List stage transition history for all visible leads
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: leadId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Stage history.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/LeadStageHistory' }
 */
router.get('/stage-history', leadController.getLeadStageHistory);

/**
 * @openapi
 * /api/leads/my-profile:
 *   get:
 *     tags: [Leads]
 *     summary: Get the current lead's profile (legacy fallback for token-authenticated leads)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lead profile.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lead' }
 */
router.get('/my-profile', leadController.getMyLead);

/**
 * @openapi
 * /api/leads/{id}:
 *   put:
 *     tags: [Leads]
 *     summary: Update lead notes / fields
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string, format: email }
 *               notes: { type: string }
 *               internalNotes: { type: string }
 *               moveInDate: { type: string, format: date }
 *               preferredTermMonths: { type: integer }
 *               unitId: { type: integer, nullable: true }
 *     responses:
 *       200:
 *         description: Updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lead' }
 */
router.put('/:id', leadController.updateLead);

/**
 * @openapi
 * /api/leads/{id}/convert:
 *   post:
 *     tags: [Leads]
 *     summary: Convert a lead into a tenant + lease (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [unitId, startDate, monthlyRent]
 *             properties:
 *               unitId: { type: integer }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               monthlyRent: { type: integer }
 *     responses:
 *       201:
 *         description: Lead converted; new lease and tenant returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lead: { $ref: '#/components/schemas/Lead' }
 *                 lease: { $ref: '#/components/schemas/Lease' }
 *                 tenant: { $ref: '#/components/schemas/Tenant' }
 */
router.post(
  '/:id/convert',
  authorizeRoles(ROLES.OWNER),
  leadController.convertLead
);

/**
 * @openapi
 * /api/leads/{id}/resend-portal:
 *   post:
 *     tags: [Leads]
 *     summary: Resend the lead-portal magic link by email
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Portal link resent.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.post('/:id/resend-portal', leadController.resendPortalLink);

/**
 * @openapi
 * /api/leads/{id}/followups:
 *   get:
 *     tags: [Leads]
 *     summary: List scheduled follow-ups for a lead
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Follow-ups.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/LeadFollowup' }
 *   post:
 *     tags: [Leads]
 *     summary: Schedule a follow-up
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [followupDate]
 *             properties:
 *               followupDate: { type: string, format: date }
 *               notes: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Follow-up created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LeadFollowup' }
 */
router.get('/:id/followups', leadController.getFollowups);
router.post('/:id/followups', leadController.createFollowup);

/**
 * @openapi
 * /api/leads/{leadId}/messages:
 *   get:
 *     tags: [Leads]
 *     summary: List chat messages between staff and a lead
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: leadId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Messages.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Message' }
 *   post:
 *     tags: [Leads]
 *     summary: Send a message to a lead
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: leadId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SendMessageRequest' }
 *     responses:
 *       201:
 *         description: Message sent.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Message' }
 */
router.get('/:leadId/messages', messageController.getMessages);
router.post('/:leadId/messages', messageController.sendMessage);

/**
 * @openapi
 * /api/leads/{leadId}/messages/read:
 *   put:
 *     tags: [Leads]
 *     summary: Mark a lead conversation as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: leadId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Read receipts updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.put('/:leadId/messages/read', messageController.markRead);

export default router;
