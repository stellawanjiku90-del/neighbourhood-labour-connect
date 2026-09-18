# Neighbourhood Labour Connect — Standalone

Neighbourhood Labour Connect is a React/Vite marketplace for customers and local service providers. This repository contains the frontend **and its own Node/Express + PostgreSQL backend**.

## No Base44 dependency

The runtime does not import, call, or require Base44 or Firebase Authentication. The old Base44 entity/function definitions have been removed. `src/api/apiClient.js` is the application API facade used by the UI; all requests go to `/api` on this application.

## Architecture

- React 18 + Vite frontend
- Node.js + Express API
- PostgreSQL via Prisma ORM
- JWT sessions
- bcryptjs for email/password credentials
- IntaSend M-Pesa STK Push for phone verification; Firebase is used only for optional web push notifications (FCM)
- IntaSend integration for M-Pesa phone verification, subscription collection, and webhook confirmation
- Same-origin file upload endpoint
- Admin role controlled by `ADMIN_PHONES`

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to PostgreSQL and a strong `JWT_SECRET`.
3. `npm install`
4. `npx prisma generate`
5. `npm run build`
6. `npm start`
7. Open `http://localhost:3000`.

For frontend/backend development separately: `npm run dev` and `npm run dev:server`.

## Render

The included `render.yaml` provisions one web service and one PostgreSQL database. Set the secret environment variables in Render before going live. The service exposes `/api/health` for health checks.

## Required production secrets

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_PHONES`
- `INTASEND_API_KEY`, `INTASEND_PUBLISHABLE_KEY`, `PHONE_VERIFICATION_AMOUNT_KES` for M-Pesa phone verification
- `FIREBASE_WEB_CONFIG` and `FIREBASE_SERVICE_ACCOUNT` only if FCM web push notifications are enabled
- `FIREBASE_SERVICE_ACCOUNT` if server-side FCM delivery is enabled
- `VAPID_PUBLIC_KEY` for browser push
- `INTASEND_API_KEY`, `INTASEND_PUBLISHABLE_KEY`, `INTASEND_WEBHOOK_SECRET` for live payments

Uploads use the local filesystem by default. On Render, use a persistent disk or replace the upload storage adapter with durable object storage before relying on uploads as permanent records.

### Phone verification

Phone verification is intentionally payment-based rather than SMS-OTP-based. The backend sends an IntaSend M-Pesa STK Push for `PHONE_VERIFICATION_AMOUNT_KES` (default KSh 100), polls the IntaSend invoice status, and also accepts IntaSend webhook confirmation. A short-lived verification token is issued only after a successful payment. IntaSend documents STK Push and payment status APIs for this flow.
