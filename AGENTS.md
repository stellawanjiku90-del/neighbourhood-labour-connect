# Project notes

This is a standalone React/Vite + Node/Express + PostgreSQL application.

- Frontend source: `src/`
- Backend: `server/index.js`
- Database schema: `prisma/schema.prisma`
- Public assets: `public/`
- Production entry point: `npm start`
- API health check: `/api/health`

Do not add hosted-platform-specific SDKs or backend dependencies. All application data access must go through the local `/api` service.
