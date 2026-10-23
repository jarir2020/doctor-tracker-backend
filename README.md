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

This repository includes a `render.yaml` Blueprint for a Node.js Web Service. In Render, create a Blueprint from this repository and use its `main` branch. The Blueprint sets `npm ci`, `npm start`, `/api/health`, and the Free plan; Render supplies `PORT`.

Set these values during Blueprint setup or in the Render service environment:

| Variable | Value |
|---|---|
| `MONGODB_URI` | The Atlas connection string for the demo database. |
| `SESSION_SECRET` | Generated automatically by the Blueprint. |
| `FRONTEND_ORIGINS` | The exact deployed Vercel origin, with no trailing slash. Update it after the frontend deploy. |
| `ADMIN_EMAIL` | The demo administrator email. |
| `ADMIN_PASSWORD` | A demo password of at least 12 characters. |
| `ADMIN_NAME` | Defaults to `Doctor Tracker Demo Admin`. |
| `NODE_ENV` | Set to `production` by the Blueprint. |

The `MONGODB_URI`, `FRONTEND_ORIGINS`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` values are intentionally not stored in `render.yaml`. Keep them in Render's environment settings and keep `.env` out of Git. After setting the Render environment, seed the demo administrator from a trusted local checkout with the same Atlas URI and admin settings in `backend/.env` by running `npm run seed:admin`.

The Render Free plan is suitable for this demonstration, but it spins down after 15 minutes without traffic and can take about a minute to wake. Use synthetic records only; do not put real patient information in the demo database.

See the frontend repository README for the complete application architecture, user-facing screenshots, and submission URLs.
