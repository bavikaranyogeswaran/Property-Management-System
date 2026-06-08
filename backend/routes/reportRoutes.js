import express from 'express';
import reportController from '../controllers/reportController.js';
import {
  authenticateToken,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/roleUtils.js';

const router = express.Router();

/**
 * @openapi
 * /api/reports/financial:
 *   get:
 *     tags: [Reports]
 *     summary: Financial report (revenue / expenses / net income)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: endDate
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: propertyId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Financial report.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/FinancialReport' }
 */
router.get(
  '/financial',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  reportController.generateFinancialReport
);

/**
 * @openapi
 * /api/reports/occupancy:
 *   get:
 *     tags: [Reports]
 *     summary: Occupancy report (unit utilization across properties)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: propertyId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Occupancy report.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OccupancyReport' }
 */
router.get(
  '/occupancy',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  reportController.generateOccupancyReport
);

/**
 * @openapi
 * /api/reports/tenant-risk:
 *   get:
 *     tags: [Reports]
 *     summary: Tenant risk report based on behavior scores and payment history
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Risk-scored tenant list.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tenantId: { type: integer }
 *                   name: { type: string }
 *                   behaviorScore: { type: integer }
 *                   latePayments: { type: integer }
 *                   risk: { type: string, enum: [low, medium, high] }
 */
router.get(
  '/tenant-risk',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  reportController.generateTenantRiskReport
);

/**
 * @openapi
 * /api/reports/maintenance:
 *   get:
 *     tags: [Reports]
 *     summary: Maintenance category breakdown
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: endDate
 *         in: query
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Categorised report.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSpend: { type: integer }
 *                 byCategory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category: { type: string }
 *                       count: { type: integer }
 *                       totalCost: { type: integer }
 */
router.get(
  '/maintenance',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  reportController.generateMaintenanceCategoryReport
);

/**
 * @openapi
 * /api/reports/leases:
 *   get:
 *     tags: [Reports]
 *     summary: Lease expiration report (upcoming churn risk)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: withinDays
 *         in: query
 *         schema: { type: integer, default: 90 }
 *     responses:
 *       200:
 *         description: Expiring leases.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Lease' }
 */
router.get(
  '/leases',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  reportController.generateLeaseExpirationReport
);

/**
 * @openapi
 * /api/reports/leads:
 *   get:
 *     tags: [Reports]
 *     summary: Lead conversion funnel
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: endDate
 *         in: query
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Funnel metrics.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalLeads: { type: integer }
 *                 converted: { type: integer }
 *                 dropped: { type: integer }
 *                 conversionRate: { type: number }
 */
router.get(
  '/leads',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  reportController.generateLeadConversionReport
);

/**
 * @openapi
 * /api/reports/ledger-summary:
 *   get:
 *     tags: [Reports]
 *     summary: Double-entry ledger summary across accounts
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: endDate
 *         in: query
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Account totals.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   debits: { type: integer }
 *                   credits: { type: integer }
 *                   balance: { type: integer }
 */
router.get(
  '/ledger-summary',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  reportController.getLedgerSummary
);

/**
 * @openapi
 * /api/reports/cash-flow:
 *   get:
 *     tags: [Reports]
 *     summary: Monthly cash flow time-series
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: year
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Monthly inflows/outflows.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   month: { type: integer }
 *                   inflow: { type: integer }
 *                   outflow: { type: integer }
 *                   net: { type: integer }
 */
router.get(
  '/cash-flow',
  authenticateToken,
  authorizeRoles(ROLES.OWNER, ROLES.TREASURER),
  reportController.getMonthlyCashFlow
);

export default router;
