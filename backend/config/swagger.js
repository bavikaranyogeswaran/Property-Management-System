// ============================================================================
//  SWAGGER / OPENAPI CONFIGURATION
// ============================================================================
//  Builds the OpenAPI 3.0 specification for the PMS backend by scanning
//  JSDoc `@openapi` annotations on every route module. The generated spec
//  is served through `swagger-ui-express` at `/api/docs`, and the raw JSON
//  is exposed at `/api/docs.json` for tooling (codegen, Postman, etc.).
// ============================================================================

import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_URL =
  process.env.SWAGGER_SERVER_URL ||
  (config.isProduction
    ? config.frontendUrl.replace(/\/$/, '')
    : `http://localhost:${config.port}`);

// ---------------------------------------------------------------------------
//  REUSABLE OPENAPI COMPONENTS
// ---------------------------------------------------------------------------
//  These are referenced from individual route files via `$ref` so that the
//  schemas stay in sync everywhere they appear.
// ---------------------------------------------------------------------------

const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'JWT access token issued by `POST /api/auth/login`. Send as `Authorization: Bearer <token>`. The same token may also be carried by the `accessToken` httpOnly cookie when the client is the official frontend.',
    },
    leadPortalToken: {
      type: 'apiKey',
      in: 'query',
      name: 'token',
      description:
        'Magic JWT issued to a lead for the public Lead Portal. Carried as `?token=...` on portal routes.',
    },
    guestInvoiceToken: {
      type: 'apiKey',
      in: 'path',
      name: 'token',
      description:
        'Single-use guest invoice token embedded in the public payment URL.',
    },
  },
  parameters: {
    IdParam: {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Numeric primary key of the resource.',
      schema: { type: 'integer', minimum: 1 },
    },
    PageParam: {
      name: 'page',
      in: 'query',
      required: false,
      description: 'Page number for paginated listings (1-based).',
      schema: { type: 'integer', minimum: 1, default: 1 },
    },
    LimitParam: {
      name: 'limit',
      in: 'query',
      required: false,
      description: 'Page size for paginated listings.',
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
    SearchParam: {
      name: 'search',
      in: 'query',
      required: false,
      description: 'Free-text search filter applied server-side.',
      schema: { type: 'string' },
    },
    StatusParam: {
      name: 'status',
      in: 'query',
      required: false,
      description: 'Filter by resource status (resource-dependent enum).',
      schema: { type: 'string' },
    },
  },
  responses: {
    BadRequest: {
      description: 'Validation failed or input was malformed.',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/Error' } },
      },
    },
    Unauthorized: {
      description: 'Missing or invalid authentication credentials.',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/Error' } },
      },
    },
    Forbidden: {
      description: 'Authenticated but not permitted to perform this action.',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/Error' } },
      },
    },
    NotFound: {
      description: 'Resource does not exist.',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/Error' } },
      },
    },
    Conflict: {
      description: 'Resource state conflict (duplicate, race condition, etc).',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/Error' } },
      },
    },
    TooManyRequests: {
      description: 'Rate limit exceeded.',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/Error' } },
      },
    },
    ServerError: {
      description: 'Unexpected server error.',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/Error' } },
      },
    },
  },
  schemas: {
    // ---------- Generic envelopes ----------
    Error: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'fail' },
        message: {
          type: 'string',
          example: 'A human-readable description of what went wrong.',
        },
        code: { type: 'string', nullable: true, example: 'INVALID_INPUT' },
        details: { type: 'object', nullable: true, additionalProperties: true },
      },
      required: ['status', 'message'],
    },
    SuccessMessage: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Operation completed.' },
      },
    },
    HealthStatus: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'degraded', 'error'] },
        app: { type: 'string', example: 'up' },
        database: {
          type: 'string',
          enum: ['connected', 'disconnected'],
        },
        redis: { type: 'string', enum: ['connected', 'disconnected'] },
        environment: { type: 'string', example: 'development' },
        uptime: { type: 'number', example: 1234.56 },
        memory: { type: 'integer', example: 134217728 },
        timestamp: { type: 'string', format: 'date-time' },
        error: { type: 'string', nullable: true },
      },
    },
    Pagination: {
      type: 'object',
      properties: {
        page: { type: 'integer', example: 1 },
        limit: { type: 'integer', example: 20 },
        total: { type: 'integer', example: 123 },
        totalPages: { type: 'integer', example: 7 },
      },
    },

    // ---------- Users / Auth ----------
    Role: {
      type: 'string',
      enum: ['owner', 'tenant', 'treasurer'],
      description: 'Role assigned to a PMS user.',
    },
    User: {
      type: 'object',
      properties: {
        user_id: { type: 'integer', example: 42 },
        name: { type: 'string', example: 'Jane Doe' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string', nullable: true, example: '+94771234567' },
        role: { $ref: '#/components/schemas/Role' },
        is_email_verified: { type: 'boolean' },
        email_verified_at: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'banned'],
        },
        is_archived: { type: 'boolean' },
        archived_at: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
    Tenant: {
      allOf: [
        { $ref: '#/components/schemas/User' },
        {
          type: 'object',
          properties: {
            nic: { type: 'string', nullable: true },
            nic_url: { type: 'string', nullable: true },
            permanent_address: { type: 'string', nullable: true },
            emergency_contact_name: { type: 'string', nullable: true },
            emergency_contact_phone: { type: 'string', nullable: true },
            employment_status: {
              type: 'string',
              enum: ['employed', 'self-employed', 'student', 'unemployed'],
              nullable: true,
            },
            monthly_income: { type: 'integer', nullable: true },
            behavior_score: { type: 'integer', example: 100 },
            credit_balance: { type: 'integer', example: 0 },
          },
        },
      ],
    },
    Owner: {
      allOf: [
        { $ref: '#/components/schemas/User' },
        {
          type: 'object',
          properties: {
            nic: { type: 'string', nullable: true },
            tin: { type: 'string', nullable: true },
            tin_url: { type: 'string', nullable: true },
            bank_name: { type: 'string', nullable: true },
            branch_name: { type: 'string', nullable: true },
            account_holder_name: { type: 'string', nullable: true },
            account_number: { type: 'string', nullable: true },
          },
        },
      ],
    },
    Treasurer: {
      allOf: [
        { $ref: '#/components/schemas/User' },
        {
          type: 'object',
          properties: {
            nic: { type: 'string', nullable: true },
            employee_id: { type: 'string', nullable: true },
            job_title: { type: 'string', nullable: true },
            shift_start: { type: 'string', nullable: true },
            shift_end: { type: 'string', nullable: true },
          },
        },
      ],
    },
    LoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', format: 'password', minLength: 8 },
      },
    },
    LoginResponse: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        token: {
          type: 'string',
          description: 'JWT access token (also set as httpOnly cookie).',
        },
        user: { $ref: '#/components/schemas/User' },
      },
    },
    ForgotPasswordRequest: {
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string', format: 'email' } },
    },
    ResetPasswordRequest: {
      type: 'object',
      required: ['token', 'newPassword'],
      properties: {
        token: { type: 'string' },
        newPassword: {
          type: 'string',
          format: 'password',
          minLength: 8,
          description:
            'Must contain uppercase, lowercase, number, and special character.',
        },
      },
    },
    ChangePasswordRequest: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string', format: 'password' },
        newPassword: { type: 'string', format: 'password', minLength: 8 },
      },
    },
    VerifyEmailRequest: {
      type: 'object',
      required: ['token'],
      properties: { token: { type: 'string' } },
    },
    SetupPasswordRequest: {
      type: 'object',
      required: ['token', 'password'],
      properties: {
        token: { type: 'string' },
        password: { type: 'string', format: 'password', minLength: 8 },
        tenantData: {
          type: 'object',
          properties: {
            nic: { type: 'string', nullable: true },
            monthlyIncome: { type: 'number' },
            permanentAddress: { type: 'string' },
            emergencyContactName: { type: 'string' },
            emergencyContactPhone: { type: 'string' },
          },
        },
      },
    },
    CreateTreasurerRequest: {
      type: 'object',
      required: ['name', 'email', 'phone'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string', example: '+94771234567' },
        nic: { type: 'string', nullable: true },
        employeeId: { type: 'string', nullable: true },
        jobTitle: { type: 'string', nullable: true },
        shiftStart: { type: 'string', nullable: true, example: '09:00' },
        shiftEnd: { type: 'string', nullable: true, example: '17:00' },
      },
    },
    UpdateTreasurerRequest: {
      allOf: [
        { $ref: '#/components/schemas/CreateTreasurerRequest' },
        {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'inactive'] },
          },
        },
      ],
    },
    UpdateProfileRequest: {
      type: 'object',
      required: ['name', 'phone'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string', example: '+94771234567' },
        nic: { type: 'string', nullable: true },
        emergencyContactName: { type: 'string', nullable: true },
        emergencyContactPhone: { type: 'string', nullable: true },
        employmentStatus: {
          type: 'string',
          nullable: true,
          enum: ['employed', 'self-employed', 'student', 'unemployed'],
        },
        permanentAddress: { type: 'string', nullable: true },
      },
    },
    AssignPropertyRequest: {
      type: 'object',
      required: ['userId', 'propertyId'],
      properties: {
        userId: { type: 'integer' },
        propertyId: { type: 'integer' },
      },
    },

    // ---------- Property / Unit ----------
    PropertyType: {
      type: 'object',
      properties: {
        type_id: { type: 'integer' },
        name: { type: 'string', example: 'Apartment' },
        description: { type: 'string', nullable: true },
      },
    },
    UnitType: {
      type: 'object',
      properties: {
        type_id: { type: 'integer' },
        name: { type: 'string', example: '2BR' },
        description: { type: 'string', nullable: true },
      },
    },
    Property: {
      type: 'object',
      properties: {
        property_id: { type: 'integer' },
        owner_id: { type: 'integer' },
        name: { type: 'string' },
        property_type_id: { type: 'integer' },
        property_no: { type: 'string', nullable: true },
        street: { type: 'string' },
        city: { type: 'string' },
        district: { type: 'string' },
        image_url: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        features: {
          type: 'array',
          items: { type: 'string' },
          example: ['parking', 'pool'],
        },
        status: { type: 'string', enum: ['active', 'inactive'] },
        is_archived: { type: 'boolean' },
        late_fee_percentage: { type: 'number', example: 3.0 },
        late_fee_type: {
          type: 'string',
          enum: ['flat_percentage', 'daily_fixed'],
        },
        late_fee_amount: { type: 'integer', example: 0 },
        late_fee_grace_period: { type: 'integer', example: 5 },
        tenant_deactivation_days: { type: 'integer', example: 30 },
        management_fee_percentage: { type: 'number', example: 0 },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
    PropertyCreateRequest: {
      type: 'object',
      required: ['name', 'street', 'city', 'district', 'propertyTypeId'],
      properties: {
        name: { type: 'string' },
        propertyNo: { type: 'string', nullable: true },
        street: { type: 'string' },
        city: { type: 'string' },
        district: { type: 'string' },
        propertyTypeId: { type: 'integer', minimum: 1 },
        description: { type: 'string', nullable: true },
        features: { type: 'array', items: { type: 'string' } },
        lateFeePercentage: { type: 'number', default: 3 },
        lateFeeType: {
          type: 'string',
          enum: ['flat_percentage', 'daily_fixed'],
          default: 'flat_percentage',
        },
        lateFeeAmount: { type: 'number', default: 0 },
        lateFeeGracePeriod: { type: 'integer', default: 5 },
        tenantDeactivationDays: { type: 'integer', default: 30 },
        managementFeePercentage: { type: 'number', default: 0 },
      },
    },
    PropertyUpdateRequest: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        propertyNo: { type: 'string', nullable: true },
        street: { type: 'string' },
        city: { type: 'string' },
        district: { type: 'string' },
        propertyTypeId: { type: 'integer' },
        description: { type: 'string', nullable: true },
        features: { type: 'array', items: { type: 'string' } },
        lateFeePercentage: { type: 'number' },
        lateFeeType: {
          type: 'string',
          enum: ['flat_percentage', 'daily_fixed'],
        },
        lateFeeAmount: { type: 'number' },
        lateFeeGracePeriod: { type: 'integer' },
        tenantDeactivationDays: { type: 'integer' },
        managementFeePercentage: { type: 'number' },
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    },
    Unit: {
      type: 'object',
      properties: {
        unit_id: { type: 'integer' },
        property_id: { type: 'integer' },
        unit_number: { type: 'string', example: 'A-101' },
        unit_type_id: { type: 'integer' },
        image_url: { type: 'string', nullable: true },
        monthly_rent: { type: 'integer', example: 75000 },
        status: {
          type: 'string',
          enum: [
            'available',
            'occupied',
            'maintenance',
            'reserved',
            'inactive',
          ],
        },
        is_turnover_cleared: { type: 'boolean' },
        is_archived: { type: 'boolean' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
    UnitCreateRequest: {
      type: 'object',
      required: ['propertyId', 'unitNumber', 'unitTypeId', 'monthlyRent'],
      properties: {
        propertyId: { type: 'integer' },
        unitNumber: { type: 'string' },
        unitTypeId: { type: 'integer' },
        monthlyRent: { type: 'integer', minimum: 0 },
        imageUrl: { type: 'string', nullable: true },
      },
    },
    PropertyImage: {
      type: 'object',
      properties: {
        image_id: { type: 'integer' },
        property_id: { type: 'integer' },
        image_url: { type: 'string' },
        is_primary: { type: 'boolean' },
        display_order: { type: 'integer' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
    UnitImage: {
      type: 'object',
      properties: {
        image_id: { type: 'integer' },
        unit_id: { type: 'integer' },
        image_url: { type: 'string' },
        is_primary: { type: 'boolean' },
        display_order: { type: 'integer' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },

    // ---------- Lease / Renewal ----------
    Lease: {
      type: 'object',
      properties: {
        lease_id: { type: 'integer' },
        tenant_id: { type: 'integer' },
        unit_id: { type: 'integer' },
        start_date: { type: 'string', format: 'date' },
        end_date: { type: 'string', format: 'date', nullable: true },
        monthly_rent: { type: 'integer' },
        status: {
          type: 'string',
          enum: [
            'draft',
            'pending',
            'active',
            'expired',
            'ended',
            'cancelled',
          ],
        },
        notice_status: {
          type: 'string',
          enum: ['undecided', 'vacating', 'renewing'],
        },
        deposit_status: {
          type: 'string',
          enum: [
            'pending',
            'paid',
            'awaiting_approval',
            'awaiting_acknowledgment',
            'disputed',
            'partially_refunded',
            'refunded',
          ],
        },
        proposed_refund_amount: { type: 'integer' },
        refunded_amount: { type: 'integer' },
        document_url: { type: 'string', nullable: true },
        is_documents_verified: { type: 'boolean' },
        verification_status: {
          type: 'string',
          enum: ['pending', 'verified', 'rejected'],
        },
        actual_checkout_at: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        signed_at: { type: 'string', format: 'date-time', nullable: true },
        reservation_expires_at: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        escalation_percentage: { type: 'number', nullable: true },
        escalation_period_months: { type: 'integer', example: 12 },
        last_escalation_date: {
          type: 'string',
          format: 'date',
          nullable: true,
        },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
    LeaseCreateRequest: {
      type: 'object',
      required: ['tenantId', 'unitId', 'startDate', 'monthlyRent'],
      properties: {
        tenantId: { type: 'integer' },
        unitId: { type: 'integer' },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date', nullable: true },
        monthlyRent: { type: 'integer', minimum: 0 },
        escalationPercentage: { type: 'number', nullable: true },
        escalationPeriodMonths: { type: 'integer', default: 12 },
      },
    },
    LeaseTerm: {
      type: 'object',
      properties: {
        term_id: { type: 'integer' },
        property_id: { type: 'integer' },
        duration_months: { type: 'integer' },
        is_default: { type: 'boolean' },
      },
    },
    RenewalRequest: {
      type: 'object',
      properties: {
        request_id: { type: 'integer' },
        lease_id: { type: 'integer' },
        current_monthly_rent: { type: 'integer' },
        proposed_monthly_rent: { type: 'integer', nullable: true },
        proposed_end_date: {
          type: 'string',
          format: 'date',
          nullable: true,
        },
        status: {
          type: 'string',
          enum: [
            'pending',
            'negotiating',
            'approved',
            'rejected',
            'cancelled',
          ],
        },
        negotiation_notes: { type: 'string', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
    ProposeTermsRequest: {
      type: 'object',
      required: ['proposedMonthlyRent', 'proposedEndDate'],
      properties: {
        proposedMonthlyRent: { type: 'number', minimum: 1 },
        proposedEndDate: { type: 'string', format: 'date' },
        notes: { type: 'string', maxLength: 1000, nullable: true },
      },
    },
    RentAdjustment: {
      type: 'object',
      properties: {
        adjustment_id: { type: 'integer' },
        lease_id: { type: 'integer' },
        effective_date: { type: 'string', format: 'date' },
        new_monthly_rent: { type: 'integer' },
        notes: { type: 'string', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
      },
    },

    // ---------- Invoices / Payments / Receipts / Payouts ----------
    Invoice: {
      type: 'object',
      properties: {
        invoice_id: { type: 'integer' },
        lease_id: { type: 'integer' },
        year: { type: 'integer', example: 2026 },
        month: { type: 'integer', minimum: 1, maximum: 12 },
        amount: { type: 'integer' },
        due_date: { type: 'string', format: 'date' },
        status: {
          type: 'string',
          enum: ['pending', 'partially_paid', 'paid', 'overdue', 'void'],
        },
        invoice_type: {
          type: 'string',
          enum: ['rent', 'maintenance', 'late_fee', 'deposit', 'other'],
        },
        description: { type: 'string', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
    InvoiceCreateRequest: {
      type: 'object',
      required: ['leaseId', 'amount', 'dueDate'],
      properties: {
        leaseId: { type: 'integer' },
        amount: { type: 'integer', minimum: 0 },
        dueDate: { type: 'string', format: 'date' },
        invoiceType: {
          type: 'string',
          enum: ['rent', 'maintenance', 'late_fee', 'deposit', 'other'],
          default: 'rent',
        },
        description: { type: 'string', nullable: true },
        year: { type: 'integer' },
        month: { type: 'integer', minimum: 1, maximum: 12 },
      },
    },
    Payment: {
      type: 'object',
      properties: {
        payment_id: { type: 'integer' },
        invoice_id: { type: 'integer' },
        amount: { type: 'integer' },
        payment_date: { type: 'string', format: 'date' },
        payment_method: { type: 'string' },
        proof_url: { type: 'string', nullable: true },
        reference_number: { type: 'string', nullable: true },
        status: {
          type: 'string',
          enum: ['pending', 'verified', 'rejected'],
        },
        verified_by: { type: 'integer', nullable: true },
        payout_id: { type: 'integer', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
    PaymentSubmitRequest: {
      type: 'object',
      required: ['invoiceId', 'amount', 'paymentDate', 'paymentMethod'],
      properties: {
        invoiceId: { type: 'integer' },
        amount: { type: 'number', minimum: 0 },
        paymentDate: { type: 'string', format: 'date' },
        paymentMethod: { type: 'string', example: 'bank_transfer' },
        referenceNumber: { type: 'string', nullable: true },
        evidenceUrl: { type: 'string', format: 'uri', nullable: true },
        proof: {
          type: 'string',
          format: 'binary',
          description:
            'Multipart form-data file upload (image or PDF) attached as `proof`.',
        },
      },
    },
    VerifyPaymentRequest: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['verified', 'rejected'] },
        reason: { type: 'string', nullable: true },
      },
    },
    Receipt: {
      type: 'object',
      properties: {
        receipt_id: { type: 'integer' },
        payment_id: { type: 'integer' },
        amount: { type: 'integer' },
        receipt_date: { type: 'string', format: 'date' },
        receipt_number: { type: 'string', example: 'RCPT-2026-000123' },
      },
    },
    Payout: {
      type: 'object',
      properties: {
        payout_id: { type: 'integer' },
        owner_id: { type: 'integer' },
        gross_amount: { type: 'integer' },
        commission_amount: { type: 'integer' },
        expenses_amount: { type: 'integer' },
        amount: { type: 'integer' },
        period_start: { type: 'string', format: 'date' },
        period_end: { type: 'string', format: 'date' },
        status: {
          type: 'string',
          enum: ['pending', 'paid', 'acknowledged', 'disputed'],
        },
        bank_reference: { type: 'string', nullable: true },
        proof_url: { type: 'string', nullable: true },
        treasurer_id: { type: 'integer', nullable: true },
        generated_at: { type: 'string', format: 'date-time' },
        processed_at: { type: 'string', format: 'date-time', nullable: true },
        acknowledged_at: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        dispute_reason: { type: 'string', nullable: true },
      },
    },

    // ---------- Leads / Visits / Messages ----------
    Lead: {
      type: 'object',
      properties: {
        lead_id: { type: 'integer' },
        property_id: { type: 'integer' },
        unit_id: { type: 'integer', nullable: true },
        name: { type: 'string' },
        phone: { type: 'string', nullable: true },
        email: { type: 'string', format: 'email', nullable: true },
        status: {
          type: 'string',
          enum: ['interested', 'converted', 'dropped'],
        },
        notes: { type: 'string', nullable: true },
        internal_notes: { type: 'string', nullable: true },
        move_in_date: { type: 'string', format: 'date', nullable: true },
        occupants_count: { type: 'integer' },
        preferred_term_months: { type: 'integer', nullable: true },
        score: { type: 'integer' },
        last_contacted_at: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
    LeadCreateRequest: {
      type: 'object',
      required: ['propertyId', 'name'],
      properties: {
        propertyId: { type: 'integer' },
        unitId: { type: 'integer', nullable: true },
        name: { type: 'string' },
        phone: { type: 'string', nullable: true },
        email: { type: 'string', format: 'email', nullable: true },
        notes: { type: 'string', nullable: true },
        moveInDate: { type: 'string', format: 'date', nullable: true },
        occupantsCount: { type: 'integer' },
        preferredTermMonths: { type: 'integer', nullable: true },
      },
    },
    LeadFollowup: {
      type: 'object',
      properties: {
        followup_id: { type: 'integer' },
        lead_id: { type: 'integer' },
        followup_date: { type: 'string', format: 'date' },
        notes: { type: 'string', nullable: true },
      },
    },
    LeadStageHistory: {
      type: 'object',
      properties: {
        history_id: { type: 'integer' },
        lead_id: { type: 'integer' },
        from_status: {
          type: 'string',
          enum: ['interested', 'converted', 'dropped'],
          nullable: true,
        },
        to_status: {
          type: 'string',
          enum: ['interested', 'converted', 'dropped'],
        },
        changed_at: { type: 'string', format: 'date-time' },
        notes: { type: 'string', nullable: true },
        duration_in_previous_stage: { type: 'integer', nullable: true },
      },
    },
    Visit: {
      type: 'object',
      properties: {
        visit_id: { type: 'integer' },
        property_id: { type: 'integer' },
        unit_id: { type: 'integer', nullable: true },
        lead_id: { type: 'integer', nullable: true },
        visitor_name: { type: 'string' },
        visitor_email: { type: 'string', format: 'email' },
        visitor_phone: { type: 'string' },
        scheduled_date: { type: 'string', format: 'date-time' },
        status: {
          type: 'string',
          enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        },
        notes: { type: 'string', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
    VisitScheduleRequest: {
      type: 'object',
      required: [
        'propertyId',
        'visitorName',
        'visitorEmail',
        'visitorPhone',
        'scheduledDate',
      ],
      properties: {
        propertyId: { type: 'integer' },
        unitId: { type: 'integer', nullable: true },
        leadId: { type: 'integer', nullable: true },
        visitorName: { type: 'string' },
        visitorEmail: { type: 'string', format: 'email' },
        visitorPhone: { type: 'string' },
        scheduledDate: { type: 'string', format: 'date-time' },
        notes: { type: 'string', nullable: true },
      },
    },
    Message: {
      type: 'object',
      properties: {
        message_id: { type: 'integer' },
        lead_id: { type: 'integer', nullable: true },
        tenant_id: { type: 'integer', nullable: true },
        sender_id: { type: 'integer', nullable: true },
        sender_lead_id: { type: 'integer', nullable: true },
        sender_type: { type: 'string', enum: ['user', 'lead'] },
        content: { type: 'string' },
        is_read: { type: 'boolean' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
    SendMessageRequest: {
      type: 'object',
      required: ['content'],
      properties: { content: { type: 'string', minLength: 1 } },
    },

    // ---------- Maintenance ----------
    MaintenanceRequest: {
      type: 'object',
      properties: {
        request_id: { type: 'integer' },
        unit_id: { type: 'integer' },
        tenant_id: { type: 'integer' },
        title: { type: 'string' },
        description: { type: 'string' },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
        },
        status: {
          type: 'string',
          enum: ['submitted', 'in_progress', 'completed', 'closed'],
        },
        eta_notes: { type: 'string', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
    MaintenanceCreateRequest: {
      type: 'object',
      required: ['unitId', 'title', 'description'],
      properties: {
        unitId: { type: 'integer' },
        title: { type: 'string' },
        description: { type: 'string' },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          default: 'medium',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Up to 5 multipart image attachments.',
        },
      },
    },
    MaintenanceCost: {
      type: 'object',
      properties: {
        cost_id: { type: 'integer' },
        request_id: { type: 'integer' },
        description: { type: 'string', nullable: true },
        amount: { type: 'integer' },
        recorded_date: { type: 'string', format: 'date' },
        bill_to: { type: 'string', enum: ['owner', 'tenant'] },
        payout_id: { type: 'integer', nullable: true },
        status: { type: 'string', enum: ['active', 'voided'] },
      },
    },
    MaintenanceCostCreateRequest: {
      type: 'object',
      required: ['requestId', 'amount', 'description'],
      properties: {
        requestId: { type: 'integer' },
        amount: { type: 'number', minimum: 0 },
        description: { type: 'string' },
        recordedDate: { type: 'string', format: 'date' },
        billTo: { type: 'string', enum: ['owner', 'tenant'], default: 'owner' },
      },
    },

    // ---------- Behavior / Notifications / Audit ----------
    BehaviorLog: {
      type: 'object',
      properties: {
        log_id: { type: 'integer' },
        tenant_id: { type: 'integer' },
        type: {
          type: 'string',
          enum: ['positive', 'negative', 'neutral'],
        },
        category: { type: 'string', example: 'on_time_payment' },
        score_change: { type: 'integer' },
        description: { type: 'string', nullable: true },
        recorded_by: { type: 'integer', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
    BehaviorCreateRequest: {
      type: 'object',
      required: ['type', 'category', 'scoreChange'],
      properties: {
        type: {
          type: 'string',
          enum: ['positive', 'negative', 'neutral'],
        },
        category: { type: 'string' },
        scoreChange: { type: 'integer' },
        description: { type: 'string', nullable: true },
      },
    },
    Notification: {
      type: 'object',
      properties: {
        notification_id: { type: 'integer' },
        user_id: { type: 'integer', nullable: true },
        message: { type: 'string' },
        type: {
          type: 'string',
          enum: [
            'invoice',
            'lease',
            'maintenance',
            'payment',
            'visit',
            'system',
          ],
        },
        severity: {
          type: 'string',
          enum: ['info', 'warning', 'urgent'],
        },
        is_read: { type: 'boolean' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
    SystemAuditLog: {
      type: 'object',
      properties: {
        log_id: { type: 'integer' },
        user_id: { type: 'integer', nullable: true },
        action_type: { type: 'string' },
        entity_id: { type: 'integer', nullable: true },
        details: { type: 'string', nullable: true },
        ip_address: { type: 'string', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
      },
    },

    // ---------- Reports ----------
    FinancialReport: {
      type: 'object',
      properties: {
        period: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date' },
            end: { type: 'string', format: 'date' },
          },
        },
        totalRevenue: { type: 'number' },
        totalExpenses: { type: 'number' },
        netIncome: { type: 'number' },
        breakdown: { type: 'object', additionalProperties: true },
      },
    },
    OccupancyReport: {
      type: 'object',
      properties: {
        totalUnits: { type: 'integer' },
        occupiedUnits: { type: 'integer' },
        availableUnits: { type: 'integer' },
        occupancyRate: { type: 'number', example: 0.92 },
        byProperty: { type: 'array', items: { type: 'object' } },
      },
    },

    // ---------- Stripe / Guest payment ----------
    StripeCheckoutRequest: {
      type: 'object',
      required: ['invoiceId'],
      properties: {
        invoiceId: { type: 'integer' },
        successUrl: { type: 'string', format: 'uri' },
        cancelUrl: { type: 'string', format: 'uri' },
      },
    },
    StripeCheckoutResponse: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        sessionId: { type: 'string' },
      },
    },
    GuestInvoice: {
      type: 'object',
      properties: {
        invoice: { $ref: '#/components/schemas/Invoice' },
        lease: { $ref: '#/components/schemas/Lease' },
        tenant: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
        property: { $ref: '#/components/schemas/Property' },
        unit: { $ref: '#/components/schemas/Unit' },
      },
    },
  },
};

// ---------------------------------------------------------------------------
//  BASE OPENAPI DEFINITION
// ---------------------------------------------------------------------------

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Property Management System API',
    version: '1.0.0',
    description: [
      'REST API for the Property Management System (PMS).',
      '',
      'The API is split into role-aware modules: **Owner**, **Treasurer**, and **Tenant**',
      'roles authenticate via JWT, while **Lead** and **Guest** flows use single-use magic tokens.',
      '',
      'All authenticated endpoints expect `Authorization: Bearer <token>`. The same token is also',
      'served as an httpOnly `accessToken` cookie for the official frontend.',
      '',
      'Monetary fields are integers in the smallest currency unit (LKR cents).',
    ].join('\n'),
    contact: { name: 'PMS Engineering' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: SERVER_URL, description: config.env },
    { url: 'http://localhost:3000', description: 'local' },
  ],
  tags: [
    { name: 'Health', description: 'Liveness / readiness checks.' },
    { name: 'Auth', description: 'Login, logout, password setup, verification.' },
    { name: 'Users', description: 'Profile management, treasurer admin, property assignment.' },
    { name: 'Admin', description: 'Operational triggers (late fees, etc).' },
    { name: 'Properties', description: 'Owner-scoped property CRUD and images.' },
    { name: 'Property Types', description: 'Lookup table for property categories.' },
    { name: 'Units', description: 'Rentable units inside properties.' },
    { name: 'Unit Types', description: 'Lookup table for unit categories.' },
    { name: 'Leases', description: 'Lease lifecycle: draft → active → ended/refund.' },
    { name: 'Lease Terms', description: 'Default term lengths per property.' },
    { name: 'Renewals', description: 'Lease renewal negotiation workflow.' },
    { name: 'Invoices', description: 'Rent and ad-hoc invoices.' },
    { name: 'Payments', description: 'Tenant payment submission and verification.' },
    { name: 'Receipts', description: 'Issued payment receipts.' },
    { name: 'Payouts', description: 'Owner payouts and reconciliation.' },
    { name: 'Stripe', description: 'Stripe Checkout sessions and webhooks.' },
    { name: 'Guest Payments', description: 'Public invoice payment via magic token.' },
    { name: 'Leads', description: 'Inbound prospect tracking.' },
    { name: 'Lead Portal', description: 'Token-authenticated lead self-service portal.' },
    { name: 'Visits', description: 'Property visit scheduling.' },
    { name: 'Maintenance', description: 'Tenant maintenance requests and ledgered costs.' },
    { name: 'Behavior', description: 'Tenant behavior scoring.' },
    { name: 'Notifications', description: 'In-app notification feed.' },
    { name: 'Messages', description: 'Lead and tenant chat threads.' },
    { name: 'Documents', description: 'Authenticated document viewer.' },
    { name: 'Images', description: 'Cloudinary-backed image uploads.' },
    { name: 'Reports', description: 'Aggregated business reports.' },
    { name: 'System', description: 'Cron status and manual job triggers.' },
    { name: 'Audit', description: 'System audit log.' },
  ],
  security: [{ bearerAuth: [] }],
  components,
};

// ---------------------------------------------------------------------------
//  BUILD SPEC FROM ROUTE FILE ANNOTATIONS
// ---------------------------------------------------------------------------

// swagger-jsdoc's underlying glob requires forward slashes on every OS — using
// path.join here would produce backslash paths on Windows that silently match
// nothing, so we build the globs manually.
const backendRoot = path
  .resolve(__dirname, '..')
  .replace(/\\/g, '/');

const options = {
  swaggerDefinition,
  apis: [
    `${backendRoot}/routes/*.js`,
    `${backendRoot}/server.js`,
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
