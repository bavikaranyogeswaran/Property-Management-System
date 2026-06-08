import { Router } from 'express';
import receiptController from '../controllers/receiptController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/receipts:
 *   get:
 *     tags: [Receipts]
 *     summary: List issued payment receipts visible to the caller
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: paymentId
 *         in: query
 *         schema: { type: integer }
 *       - name: leaseId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Receipts.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Receipt' }
 */
router.get('/', authenticateToken, receiptController.getReceipts);

export default router;
