import { Router } from 'express';
import messageController from '../controllers/messageController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

const router = Router();

/**
 * @openapi
 * /api/messages/tenant/thread:
 *   get:
 *     tags: [Messages]
 *     summary: Tenant fetches their own conversation thread
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Thread.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Message' }
 *   post:
 *     tags: [Messages]
 *     summary: Tenant sends a message to their property staff
 *     security: [{ bearerAuth: [] }]
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
router.get(
  '/tenant/thread',
  authenticateToken,
  authorizeRoles(ROLES.TENANT),
  messageController.getTenantMessages
);
router.post(
  '/tenant/thread',
  authenticateToken,
  authorizeRoles(ROLES.TENANT),
  messageController.sendTenantMessage
);

/**
 * @openapi
 * /api/messages/tenant/thread/read:
 *   put:
 *     tags: [Messages]
 *     summary: Tenant marks their thread as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Marked read.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.put(
  '/tenant/thread/read',
  authenticateToken,
  authorizeRoles(ROLES.TENANT),
  messageController.markTenantRead
);

/**
 * @openapi
 * /api/messages/owner/tenant/{tenantId}:
 *   get:
 *     tags: [Messages]
 *     summary: Owner/system fetches a tenant thread
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: tenantId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thread.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Message' }
 *   post:
 *     tags: [Messages]
 *     summary: Owner/system sends a message to a tenant
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
 *           schema: { $ref: '#/components/schemas/SendMessageRequest' }
 *     responses:
 *       201:
 *         description: Message sent.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Message' }
 */
router.get(
  '/owner/tenant/:tenantId',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.SYSTEM),
  messageController.getTenantMessages
);
router.post(
  '/owner/tenant/:tenantId',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.SYSTEM),
  messageController.sendTenantMessage
);

/**
 * @openapi
 * /api/messages/owner/tenant/{tenantId}/read:
 *   put:
 *     tags: [Messages]
 *     summary: Owner/system marks a tenant thread as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: tenantId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Marked read.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.put(
  '/owner/tenant/:tenantId/read',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.SYSTEM),
  messageController.markTenantRead
);

/**
 * @openapi
 * /api/messages/{leadId}:
 *   post:
 *     tags: [Messages]
 *     summary: Send a message to a lead (Owner / System)
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
 *   get:
 *     tags: [Messages]
 *     summary: List lead messages
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
 */
router.post(
  '/:leadId',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.SYSTEM),
  messageController.sendMessage
);
router.get(
  '/:leadId',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.SYSTEM, ROLES.TENANT),
  messageController.getMessages
);

/**
 * @openapi
 * /api/messages/{leadId}/read:
 *   put:
 *     tags: [Messages]
 *     summary: Mark a lead thread as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: leadId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Marked read.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.put(
  '/:leadId/read',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.SYSTEM, ROLES.TENANT),
  messageController.markRead
);

export default router;
