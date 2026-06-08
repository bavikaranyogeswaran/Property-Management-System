import { Router } from 'express';
import rateLimit from 'express-rate-limit';
const router = Router();
import authController from '../controllers/authController.js';

import passwordController from '../controllers/passwordController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { loginLimiter, sensitiveActionLimiter } from '../utils/rateLimiters.js';
import {
  loginSchema,
  verifyEmailSchema,
  setupPasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../schemas/authSchemas.js';

// Note: local loginLimiter removed, replaced by import

import upload from '../middleware/upload.js';

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate a user and issue a JWT
 *     description: Exchanges email + password for a JWT. The token is returned in the body and also set as a httpOnly `accessToken` cookie.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.post(
  '/login',
  loginLimiter,
  validateRequest(loginSchema),
  authController.login
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Invalidate the current session
 *     description: Clears the `accessToken` cookie. The frontend should also discard any cached token.
 *     security: []
 *     responses:
 *       200:
 *         description: Logged out.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.post('/logout', authController.logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/me', authenticateToken, authController.me);

/**
 * @openapi
 * /api/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify an email address using the token from the verification email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VerifyEmailRequest' }
 *     responses:
 *       200:
 *         description: Email verified.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.post(
  '/verify-email',
  sensitiveActionLimiter,
  validateRequest(verifyEmailSchema),
  authController.verifyEmail
);

/**
 * @openapi
 * /api/auth/setup-password:
 *   post:
 *     tags: [Auth]
 *     summary: Complete account setup by setting a password
 *     description: Invitation flow — tenants and treasurers receive a setup link; this endpoint finalizes their password and (for tenants) attaches profile fields and NIC document.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/SetupPasswordRequest'
 *               - type: object
 *                 properties:
 *                   nicDoc:
 *                     type: string
 *                     format: binary
 *                     description: Optional NIC scan upload.
 *     responses:
 *       200:
 *         description: Password set; account activated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
router.post(
  '/setup-password',
  upload.single('nicDoc'),
  validateRequest(setupPasswordSchema),
  authController.setupPassword
);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ForgotPasswordRequest' }
 *     responses:
 *       200:
 *         description: Reset email dispatched (response is identical for unknown emails to prevent enumeration).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.post(
  '/forgot-password',
  sensitiveActionLimiter,
  validateRequest(forgotPasswordSchema),
  passwordController.forgotPassword
);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset the password using a token from the reset email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ResetPasswordRequest' }
 *     responses:
 *       200:
 *         description: Password updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.post(
  '/reset-password',
  sensitiveActionLimiter,
  validateRequest(resetPasswordSchema),
  passwordController.resetPassword
);

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change the authenticated user's password
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ChangePasswordRequest' }
 *     responses:
 *       200:
 *         description: Password changed; all other sessions are invalidated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post(
  '/change-password',
  authenticateToken,
  validateRequest(changePasswordSchema),
  passwordController.changePassword
);

export default router;
