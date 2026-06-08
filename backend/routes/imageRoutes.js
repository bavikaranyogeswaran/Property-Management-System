import { Router } from 'express';
import imageController from '../controllers/imageController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = Router();

/**
 * @openapi
 * /api/properties/{propertyId}/images:
 *   get:
 *     tags: [Images]
 *     summary: List images for a property (public)
 *     security: []
 *     parameters:
 *       - name: propertyId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Images.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/PropertyImage' }
 */
router.get('/properties/:propertyId/images', imageController.getPropertyImages);

/**
 * @openapi
 * /api/units/{unitId}/images:
 *   get:
 *     tags: [Images]
 *     summary: List images for a unit (public)
 *     security: []
 *     parameters:
 *       - name: unitId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Images.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/UnitImage' }
 */
router.get('/units/:unitId/images', imageController.getUnitImages);

router.use(authenticateToken);

/**
 * @openapi
 * /api/upload:
 *   post:
 *     tags: [Images]
 *     summary: Upload a general file to Cloudinary (public read URL)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Upload successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url: { type: string, format: uri }
 *                 publicId: { type: string }
 */
router.post(
  '/upload',
  upload.single('file'),
  imageController.uploadGeneralFile
);

/**
 * @openapi
 * /api/upload/private:
 *   post:
 *     tags: [Images]
 *     summary: Upload a private (signed-URL) file to Cloudinary
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Upload successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url: { type: string, format: uri }
 *                 publicId: { type: string }
 */
import { privateUpload } from '../middleware/upload.js';
router.post(
  '/upload/private',
  privateUpload.single('file'),
  imageController.uploadGeneralFile
);

router.use(authorizeRoles('owner'));

/**
 * @openapi
 * /api/properties/{propertyId}/images:
 *   post:
 *     tags: [Images]
 *     summary: Upload up to 10 property images (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: propertyId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Uploaded.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/PropertyImage' }
 */
router.post(
  '/properties/:propertyId/images',
  upload.array('images', 10),
  imageController.uploadPropertyImages
);

/**
 * @openapi
 * /api/properties/{propertyId}/images/{imageId}/primary:
 *   put:
 *     tags: [Images]
 *     summary: Set a property image as the primary image (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: propertyId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: imageId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PropertyImage' }
 */
router.put(
  '/properties/:propertyId/images/:imageId/primary',
  imageController.setPropertyPrimaryImage
);

/**
 * @openapi
 * /api/properties/images/{imageId}:
 *   delete:
 *     tags: [Images]
 *     summary: Delete a property image (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: imageId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.delete(
  '/properties/images/:imageId',
  imageController.deletePropertyImage
);

/**
 * @openapi
 * /api/units/{unitId}/images:
 *   post:
 *     tags: [Images]
 *     summary: Upload up to 10 unit images (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: unitId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Uploaded.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/UnitImage' }
 */
router.post(
  '/units/:unitId/images',
  upload.array('images', 10),
  imageController.uploadUnitImages
);

/**
 * @openapi
 * /api/units/{unitId}/images/{imageId}/primary:
 *   put:
 *     tags: [Images]
 *     summary: Set a unit image as primary (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: unitId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: imageId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UnitImage' }
 */
router.put(
  '/units/:unitId/images/:imageId/primary',
  imageController.setUnitPrimaryImage
);

/**
 * @openapi
 * /api/units/images/{imageId}:
 *   delete:
 *     tags: [Images]
 *     summary: Delete a unit image (Owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: imageId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 */
router.delete('/units/images/:imageId', imageController.deleteUnitImage);

export default router;
