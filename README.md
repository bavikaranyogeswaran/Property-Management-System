# Property Management System

A full-stack web application for managing rental properties — covering the complete lifecycle from lead generation through lease management, rent collection, maintenance tracking, and financial reporting.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Local Development](#local-development)
  - [Docker (Recommended)](#docker-recommended)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Database](#database)
- [Background Jobs](#background-jobs)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Overview

This system is designed for property owners, tenants, and treasurers to manage residential and commercial rental properties. It supports multi-role access control, automated billing, Stripe-powered payments, Cloudinary-hosted media, and detailed audit logging.

---

## Features

| Area                   | Capabilities                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| **Authentication**     | JWT-based auth, email verification, password reset, role-based access (Owner / Tenant / Treasurer) |
| **Properties & Units** | Property registration with images, amenities, unit types, availability tracking                    |
| **Leads**              | Lead capture, follow-up scheduling, stage history, lead scoring, guest portal                      |
| **Leases**             | Full lifecycle — creation, renewal, escalation, termination, refund handling                       |
| **Payments & Billing** | Rent invoicing, receipts, ledger, Stripe integration, payment simulation mode                      |
| **Maintenance**        | Request creation, cost tracking, status updates, ETA, technician notes                             |
| **Tenants**            | Profiles, NIC/document storage, behavior scoring, emergency contacts                               |
| **Financial Reports**  | Rent reports, payment summaries, owner payouts, financial dashboards                               |
| **Notifications**      | In-app notifications and email alerts via Gmail SMTP                                               |
| **Auditing**           | Full audit trail, behavior logging, activity tracking                                              |
| **Admin / System**     | Health checks, cache management, image management                                                  |

---

## Tech Stack

### Backend

- **Runtime:** Node.js 20 (Alpine)
- **Framework:** Express.js
- **Database:** MySQL 8.0 via Knex.js (query builder + migrations)
- **Cache / Queue:** Redis 7 + BullMQ
- **Scheduling:** node-cron
- **Payments:** Stripe
- **Media:** Cloudinary
- **Email:** Nodemailer (Gmail SMTP)
- **Logging:** Winston with daily log rotation
- **Security:** Helmet, CORS, rate limiting, XSS sanitization
- **Validation:** Joi

### Frontend

- **Framework:** React 18 + TypeScript
- **Build tool:** Vite 6
- **Styling:** Tailwind CSS 4 + Material-UI 7
- **Components:** Radix UI primitives
- **Validation:** Zod
- **HTTP:** Axios

### Infrastructure

- **Containerization:** Docker + Docker Compose
- **Web server (prod):** Nginx (serves the React SPA)
- **CI hooks:** Husky + lint-staged + Prettier

---

## Architecture

```
┌─────────────────┐     HTTP      ┌──────────────────────┐
│  React SPA      │ ───────────► │  Express API Server  │
│  (Vite/Nginx)   │              │  (server.js)         │
└─────────────────┘              └──────────┬───────────┘
                                            │
                        ┌───────────────────┼──────────────────┐
                        │                   │                  │
                  ┌─────▼──────┐    ┌───────▼───────┐  ┌──────▼──────┐
                  │  MySQL 8   │    │   Redis 7     │  │  Cloudinary │
                  │ (data)     │    │ (cache/queue) │  │  (images)   │
                  └────────────┘    └───────┬───────┘  └─────────────┘
                                            │
                                   ┌────────▼────────┐
                                   │  BullMQ Worker  │
                                   │  (worker.js)    │
                                   └─────────────────┘
```

- **API server** (`server.js`) handles all user-facing HTTP requests.
- **Worker** (`worker.js`) is a separate process that consumes background jobs from Redis queues — rent generation, late fee calculation, email notifications — keeping the API responsive.
- **Knex migrations** version the database schema across all environments.

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (recommended)
- MySQL 8.0 and Redis 7 (if running locally without Docker)

### Environment Variables

Copy the example below to a `.env` file in the project root, then fill in the secrets.

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=pms_admin
DB_PASSWORD=your_db_password
DB_NAME=pms_database
DB_ROOT_PASSWORD=your_root_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ENABLED=true

# Email (Gmail SMTP)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password

# Frontend
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_PAYMENT_SIMULATION=true
```

> For Gmail SMTP, generate an [App Password](https://myaccount.google.com/apppasswords) with 2FA enabled.

---

### Local Development

```bash
# 1. Install root workspace dependencies
npm install

# 2. Backend
cd backend
npm install
npm run migrate:latest   # Apply all database migrations
npm run dev              # Start API server on :3000

# 3. Worker (separate terminal)
cd backend
node worker.js

# 4. Frontend (separate terminal)
cd frontend
npm install
npm run dev              # Start Vite dev server on :5173
```

Access the app at `http://localhost:5173`.

---

### Docker (Recommended)

Starts MySQL, Redis, the API server, the background worker, and the Nginx-served frontend in one command.

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Stop everything
docker compose down
```

On Windows, you can also use the included PowerShell deployment script:

```powershell
.\deploy.ps1
```

This script validates the `.env` file, checks Docker availability, builds images, starts containers, and monitors service health.

**Service endpoints after startup:**

| Service      | URL                              |
| ------------ | -------------------------------- |
| Frontend     | http://localhost:5173            |
| Backend API  | http://localhost:3000/api        |
| Health check | http://localhost:3000/api/health |
| MySQL        | localhost:3307                   |
| Redis        | localhost:6379                   |

---

## Project Structure

```
Property Management System/
├── backend/
│   ├── config/             # Database, Redis, queue, and app config
│   ├── controllers/        # Request handlers (31 controllers)
│   ├── models/             # Knex query models (29 models)
│   ├── routes/             # Express route definitions (29 modules)
│   ├── services/           # Business logic (31 services)
│   ├── middleware/         # Auth, validation, upload, rate limiting
│   ├── migrations/         # Knex schema migrations (30+ files)
│   ├── queues/             # BullMQ job processors
│   ├── schemas/            # Joi request validation schemas
│   ├── utils/              # Logger, email, PDF, billing engine, audit log
│   ├── database/           # schema.sql reference
│   ├── tests/              # Vitest + Supertest test files
│   ├── server.js           # Express app entry point
│   └── worker.js           # Background worker entry point
│
├── frontend/
│   ├── src/
│   │   ├── app/            # App root, routing, context providers
│   │   ├── components/
│   │   │   ├── pages/      # Page components by role (owner, tenant, treasurer)
│   │   │   ├── common/     # Shared UI components
│   │   │   ├── layout/     # Layout wrappers
│   │   │   ├── reports/    # Report-specific components
│   │   │   └── ui/         # Radix UI + custom primitives
│   │   ├── services/       # Axios API client
│   │   ├── contexts/       # React context (Auth, Property, Financial, etc.)
│   │   ├── schemas/        # Zod validation schemas
│   │   └── types/          # TypeScript type definitions
│   ├── nginx.conf          # Nginx config for production SPA serving
│   └── Dockerfile          # Multi-stage build (Node → Nginx)
│
├── docker-compose.yml      # Full-stack service orchestration
├── deploy.ps1              # Windows PowerShell deployment script
└── package.json            # Root workspace (Husky, Prettier, lint-staged)
```

---

## API Overview

All endpoints are prefixed with `/api`.

| Resource      | Base Path                   | Key Operations                                |
| ------------- | --------------------------- | --------------------------------------------- |
| Auth          | `/api/auth`                 | Register, login, email verify, password reset |
| Users         | `/api/users`                | Profile management, role assignment           |
| Properties    | `/api/properties`           | CRUD, images, amenities                       |
| Units         | `/api/units`                | CRUD, availability                            |
| Leases        | `/api/leases`               | Create, renew, terminate, billing             |
| Payments      | `/api/payments`             | Record payment, Stripe flow                   |
| Invoices      | `/api/invoices`             | Generate, view, PDF                           |
| Receipts      | `/api/receipts`             | Acknowledgement, download                     |
| Leads         | `/api/leads`                | Create, follow-ups, conversion                |
| Maintenance   | `/api/maintenance-requests` | Submit, update status, costs                  |
| Reports       | `/api/reports`              | Rent, payment, payout reports                 |
| Notifications | `/api/notifications`        | List, mark read                               |
| Audit         | `/api/audit`                | Activity log                                  |
| Health        | `/api/health`               | Liveness check                                |

---

## Database

Managed with **Knex.js migrations**. All schema changes are versioned under `backend/migrations/`.

```bash
# Apply all pending migrations
npm run migrate:latest

# Rollback the last batch
npm run migrate:rollback

# Create a new migration file
npm run migrate:make -- <migration_name>
```

The reference schema (`backend/database/schema.sql`) documents all 20+ normalized tables including: `users`, `properties`, `units`, `leases`, `payments`, `invoices`, `receipts`, `ledger_entries`, `maintenance_requests`, `leads`, `audit_logs`, and more.

---

## Background Jobs

The worker process (`backend/worker.js`) runs BullMQ consumers and cron jobs independently of the API server:

| Job                  | Trigger        | Purpose                                         |
| -------------------- | -------------- | ----------------------------------------------- |
| Rent generation      | Monthly (cron) | Auto-create rent invoices for active leases     |
| Late fee calculation | Daily (cron)   | Apply late fees to overdue invoices             |
| Lease expiry check   | Daily (cron)   | Flag expiring leases, trigger renewal reminders |
| Email notifications  | Event-driven   | Send payment receipts, reminders, alerts        |
| Behavior scoring     | Periodic       | Recalculate tenant behavior scores              |

Start the worker separately from the API:

```bash
node backend/worker.js
```

In Docker, the worker runs as its own container alongside the API container.

---

## Testing

```bash
cd backend
npm run test
```

Tests use **Vitest** as the runner and **Supertest** for HTTP integration testing against a test MySQL database (configured via `NODE_ENV=test` in `knexfile.js`).

---

## Deployment

### Docker Compose (Production)

1. Set `NODE_ENV=production` in `.env`
2. Use production Stripe keys and a strong `JWT_SECRET`
3. Run:
   ```bash
   docker compose up -d --build
   ```

### Manual Deploy (Windows)

```powershell
.\deploy.ps1
```

The script:

- Validates required environment variables
- Confirms Docker is running
- Builds and tags images
- Starts all containers with health checks
- Streams health monitoring output

### Production Notes

- The frontend Dockerfile produces a static Nginx build — point a reverse proxy (Nginx, Caddy, etc.) at port `5173`.
- The backend auto-runs `npm run migrate:latest` on container start.
- Winston logs rotate daily and are stored in `backend/logs/` (also supports AWS CloudWatch).
- Redis persistence is configured with a named Docker volume (`redis_data`).
- MySQL data is persisted via the `mysql_data` volume.
