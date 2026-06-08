import express from 'express';
import leadPortalController from '../controllers/leadPortalController.js';

const router = express.Router();

/**
 * @openapi
 * /api/lead-portal:
 *   get:
 *     tags: [Lead Portal]
 *     summary: Get the lead portal payload (profile + property + unit)
 *     description: Authenticated via the `token` query parameter (magic JWT issued at lead creation).
 *     security:
 *       - leadPortalToken: []
 *     parameters:
 *       - name: token
 *         in: query
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Portal payload.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lead: { $ref: '#/components/schemas/Lead' }
 *                 property: { $ref: '#/components/schemas/Property' }
 *                 unit: { $ref: '#/components/schemas/Unit' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', leadPortalController.getPortalData);

/**
 * @openapi
 * /api/lead-portal/messages:
 *   get:
 *     tags: [Lead Portal]
 *     summary: List portal chat messages
 *     security:
 *       - leadPortalToken: []
 *     parameters:
 *       - name: token
 *         in: query
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Messages.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Message' }
 *   post:
 *     tags: [Lead Portal]
 *     summary: Send a portal message
 *     security:
 *       - leadPortalToken: []
 *     parameters:
 *       - name: token
 *         in: query
 *         required: true
 *         schema: { type: string }
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
router.get('/messages', leadPortalController.getMessages);
router.post('/messages', leadPortalController.sendMessage);

/**
 * @openapi
 * /api/lead-portal/preferences:
 *   put:
 *     tags: [Lead Portal]
 *     summary: Update lead-provided preferences
 *     security:
 *       - leadPortalToken: []
 *     parameters:
 *       - name: token
 *         in: query
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moveInDate: { type: string, format: date }
 *               preferredTermMonths: { type: integer }
 *               occupantsCount: { type: integer }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Preferences saved.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Lead' }
 */
router.put('/preferences', leadPortalController.updatePreferences);

export default router;
