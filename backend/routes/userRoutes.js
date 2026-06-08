import { Router } from 'express';
import userController from '../controllers/userController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  createTreasurerSchema,
  updateTreasurerSchema,
  updateProfileSchema,
} from '../schemas/userSchemas.js';

const router = Router();

/**
 * @openapi
 * /api/users/create-treasurer:
 *   post:
 *     tags: [Users]
 *     summary: Invite a new treasurer (Owner only)
 *     description: Creates a treasurer account in `inactive` state and sends an invitation email with a setup-password link.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateTreasurerRequest' }
 *     responses:
 *       201:
 *         description: Invitation sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 user: { $ref: '#/components/schemas/Treasurer' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post(
  '/create-treasurer',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  validateRequest(createTreasurerSchema),
  userController.createTreasurer
);

/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get the authenticated user's full profile (with role-specific extension)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile fetched.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Owner'
 *                 - $ref: '#/components/schemas/Tenant'
 *                 - $ref: '#/components/schemas/Treasurer'
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   put:
 *     tags: [Users]
 *     summary: Update the authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateProfileRequest' }
 *     responses:
 *       200:
 *         description: Profile updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/profile', authenticateToken, userController.getProfile);
router.put(
  '/profile',
  authenticateToken,
  validateRequest(updateProfileSchema),
  userController.updateProfile
);

/**
 * @openapi
 * /api/users/assign-property:
 *   post:
 *     tags: [Users]
 *     summary: Assign a property to a treasurer (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AssignPropertyRequest' }
 *     responses:
 *       200:
 *         description: Assignment created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post(
  '/assign-property',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  userController.assignProperty
);

/**
 * @openapi
 * /api/users/treasurers:
 *   get:
 *     tags: [Users]
 *     summary: List treasurers (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Treasurers fetched.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Treasurer' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  '/treasurers',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  userController.getTreasurers
);

/**
 * @openapi
 * /api/users/tenants:
 *   get:
 *     tags: [Users]
 *     summary: List tenants (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Tenants fetched.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Tenant' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  '/tenants',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  userController.getTenants
);

/**
 * @openapi
 * /api/users/owners:
 *   get:
 *     tags: [Users]
 *     summary: List owners (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Owners fetched.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Owner' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  '/owners',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  userController.getOwners
);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: User fetched.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Users]
 *     summary: Update a treasurer (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateTreasurerRequest' }
 *     responses:
 *       200:
 *         description: Treasurer updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Treasurer' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Users]
 *     summary: Archive (soft-delete) a treasurer (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Treasurer archived.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id(\\d+)', authenticateToken, userController.getUserById);
router.put(
  '/:id(\\d+)',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  validateRequest(updateTreasurerSchema),
  userController.updateTreasurer
);
router.delete(
  '/:id(\\d+)',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  userController.deleteTreasurer
);

/**
 * @openapi
 * /api/users/{id}/force-logout:
 *   post:
 *     tags: [Users]
 *     summary: Force a user's sessions to be invalidated (Owner only)
 *     description: Bumps the user's `token_version` so any outstanding JWTs are rejected.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Sessions revoked.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post(
  '/:id(\\d+)/force-logout',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  userController.forceLogout
);

/**
 * @openapi
 * /api/users/{id}/resend-invitation:
 *   post:
 *     tags: [Users]
 *     summary: Resend the setup invitation email (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Invitation re-sent.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400:
 *         description: User has already activated their account.
 */
router.post(
  '/:id(\\d+)/resend-invitation',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  userController.resendInvitation
);

/**
 * @openapi
 * /api/users/{userId}/assign-property/{propertyId}:
 *   delete:
 *     tags: [Users]
 *     summary: Remove a property assignment from a user (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: propertyId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Assignment removed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete(
  '/:userId(\\d+)/assign-property/:propertyId(\\d+)',
  authenticateToken,
  authorizeRoles(ROLES.OWNER),
  userController.removeProperty
);

/**
 * @openapi
 * /api/users/{userId}/assigned-properties:
 *   get:
 *     tags: [Users]
 *     summary: List properties assigned to a user (Owner / Treasurer)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Assigned properties.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Property' }
 */
router.get(
  '/:userId(\\d+)/assigned-properties',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  userController.getAssignedProperties
);

export default router;
