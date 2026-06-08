import { Router } from 'express';
import visitController from '../controllers/visitController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/visits:
 *   post:
 *     tags: [Visits]
 *     summary: Schedule a property visit (public)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VisitScheduleRequest' }
 *     responses:
 *       201:
 *         description: Visit scheduled.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Visit' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *   get:
 *     tags: [Visits]
 *     summary: List scheduled visits (staff only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: propertyId
 *         in: query
 *         schema: { type: integer }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [pending, confirmed, cancelled, completed] }
 *     responses:
 *       200:
 *         description: Visits.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Visit' }
 */
router.post('/', visitController.scheduleVisit);
router.get('/', authenticateToken, visitController.getVisits);

/**
 * @openapi
 * /api/visits/{id}/status:
 *   patch:
 *     tags: [Visits]
 *     summary: Update a visit's status
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
 *               status: { type: string, enum: [pending, confirmed, cancelled, completed] }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Status updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Visit' }
 */
router.patch('/:id/status', authenticateToken, visitController.updateStatus);

/**
 * @openapi
 * /api/visits/{id}/reschedule:
 *   patch:
 *     tags: [Visits]
 *     summary: Reschedule a visit
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheduledDate]
 *             properties:
 *               scheduledDate: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Visit rescheduled.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Visit' }
 */
router.patch(
  '/:id/reschedule',
  authenticateToken,
  visitController.rescheduleVisit
);

/**
 * @openapi
 * /api/visits/{id}/cancel:
 *   post:
 *     tags: [Visits]
 *     summary: Visitor cancels their own scheduled visit (public)
 *     security: []
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Visit cancelled.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Visit' }
 */
router.post('/:id/cancel', visitController.cancelVisit);

export default router;
