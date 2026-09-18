# Deployment checklist

## Render (single service + PostgreSQL)

1. Push this repository to GitHub.
2. Create a Render Blueprint from `render.yaml`, or create a Node web service with the same build/start commands.
3. Keep the project root as the service root. Do not set a nested root directory.
4. Add the production secrets listed in `.env.example`.
5. Set `ADMIN_PHONES` to the exact administrator phone numbers in E.164 format.
6. Set `ADMIN_INITIAL_PIN_HASH` if the administrator accounts need to be bootstrapped with a PIN. The server will create missing admin accounts automatically on startup and will never grant the admin role to an unlisted phone number.
7. Configure the IntaSend webhook URL as `/api/webhooks/intasend` and set the same `INTASEND_WEBHOOK_SECRET`.
8. Configure IntaSend for phone verification: set `INTASEND_API_KEY`, `INTASEND_PUBLISHABLE_KEY`, `INTASEND_TEST_ENVIRONMENT=false`, `PHONE_VERIFICATION_AMOUNT_KES=100`, and `VERIFICATION_RECEIPT_EMAIL`. Registration and PIN recovery use an IntaSend M-Pesa STK Push; the server verifies the payment status before issuing the verification token. Firebase Authentication is **not** used. If web push notifications are enabled, configure only the Firebase FCM settings (`FIREBASE_WEB_CONFIG` and `FIREBASE_SERVICE_ACCOUNT`).
9. Generate a VAPID key pair with `npm run generate:vapid` and place the public key in `VAPID_PUBLIC_KEY`.
10. Verify `https://YOUR-DOMAIN/api/health` returns `{ "ok": true, ... }`.

## Important

The application is intentionally one deployable Node service: Express serves `/api` and the Vite `dist` folder. PostgreSQL is the persistent application database.

Uploaded files are stored in `UPLOAD_DIR`. A Render persistent disk or a durable object-storage adapter is required if uploads must survive service replacement/deploys.
