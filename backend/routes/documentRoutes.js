import express from 'express';
import documentController from '../controllers/documentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/documents/view/{id}:
 *   get:
 *     tags: [Documents]
 *     summary: Stream / view a stored document by ID (authorization enforced server-side)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Document binary stream (PDF / image).
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *           image/*:
 *             schema: { type: string, format: binary }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/view/:id', authenticateToken, documentController.viewDocument);

export default router;
