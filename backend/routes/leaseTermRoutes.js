import express from 'express';
import leaseTermController from '../controllers/leaseTermController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';

const router = express.Router();

// All lease term routes are for owners
router.use(authenticateToken);
router.use(authorizeRoles('owner'));

/**
 * @openapi
 * /api/lease-terms:
 *   get:
 *     tags: [Lease Terms]
 *     summary: List configured lease terms (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: propertyId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lease terms.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/LeaseTerm' }
 *   post:
 *     tags: [Lease Terms]
 *     summary: Create a new lease term option (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propertyId, durationMonths]
 *             properties:
 *               propertyId: { type: integer }
 *               durationMonths: { type: integer, minimum: 1 }
 *               isDefault: { type: boolean }
 *     responses:
 *       201:
 *         description: Created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LeaseTerm' }
 */
router.get('/', leaseTermController.getLeaseTerms);
router.post('/', leaseTermController.createLeaseTerm);

/**
 * @openapi
 * /api/lease-terms/{id}:
 *   put:
 *     tags: [Lease Terms]
 *     summary: Update a lease term (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               durationMonths: { type: integer }
 *               isDefault: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LeaseTerm' }
 *   delete:
 *     tags: [Lease Terms]
 *     summary: Delete a lease term (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Deleted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.put('/:id', leaseTermController.updateLeaseTerm);
router.delete('/:id', leaseTermController.deleteLeaseTerm);

export default router;
