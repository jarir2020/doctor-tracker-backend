# Doctor Tracker API

Standalone Express REST API for the Doctor Tracker admin portal. This repository is independent from the Next.js frontend repository.

## Local setup

1. Install Node.js 22 or newer and MongoDB, or create a MongoDB Atlas cluster.
2. Copy `.env.example` to `.env`. The example file includes local demo admin credentials; set `MONGODB_URI` to your local MongoDB or Atlas connection string.
3. Install packages with `npm install`.
4. Create or update the initial administrator with `npm run seed:admin`.
5. Start the API with `npm run dev`. It listens on `http://localhost:4000`.

Local demo sign-in:

- Email: `demo.admin@example.com`
- Password: `DoctorDemo123!`

These credentials and the session secret are for local demo use only.

The API is mounted under `/api`. `GET /api/health` reports service and database availability. The frontend origin must be listed in `FRONTEND_ORIGINS`.

## API routes

- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/dashboard/summary`
- `GET /api/doctors`, `POST /api/doctors`, `GET /api/doctors/specializations`, `GET /api/doctors/:doctorId`
- `GET /api/doctors/:doctorId/patients`, `POST /api/doctors/:doctorId/patients`, `DELETE /api/doctors/:doctorId/patients/:patientId`
- `GET /api/patients`, `GET /api/patients/conditions`, `PATCH /api/patients/:patientId`, `DELETE /api/patients/:patientId`

List responses include `items` and `pagination` with page, limit, total, and totalPages. Search, date filters, condition filters, and pagination are applied by the API.

## Deployment

Deploy this repository as a Render Web Service. Configure `MONGODB_URI`, `SESSION_SECRET`, `FRONTEND_ORIGINS`, `NODE_ENV=production`, and the platform-provided `PORT` in Render's environment settings. Use `/api/health` as the health-check path. Never commit `.env` or real patient data.

See the frontend repository README for the complete application architecture, user-facing screenshots, and submission URLs.
