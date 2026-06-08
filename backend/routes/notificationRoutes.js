import { Router } from 'express';
import notificationController from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List the authenticated user's notifications
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: isRead
 *         in: query
 *         schema: { type: boolean }
 *       - name: type
 *         in: query
 *         schema: { type: string, enum: [invoice, lease, maintenance, payment, visit, system] }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Notifications.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Notification' }
 */
router.get('/', authenticateToken, notificationController.getNotifications);

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Marked read.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Notification' }
 */
router.put('/:id/read', authenticateToken, notificationController.markAsRead);

/**
 * @openapi
 * /api/notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all of the user's notifications as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All marked read.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.put(
  '/read-all',
  authenticateToken,
  notificationController.markAllAsRead
);

/**
 * @openapi
 * /api/notifications/read:
 *   delete:
 *     tags: [Notifications]
 *     summary: Bulk-delete all read notifications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted: { type: integer }
 */
router.delete('/read', authenticateToken, notificationController.clearRead);

/**
 * @openapi
 * /api/notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a single notification
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Deleted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.delete(
  '/:id',
  authenticateToken,
  notificationController.deleteNotification
);

export default router;
