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

Deploy this repository as a separate Vercel project for the Express API. Vercel detects Express at `src/server.js` and runs the application as a Vercel Function; the current `app.listen` startup pattern is supported ([Express on Vercel](https://vercel.com/docs/frameworks/backend/express)).

Set these values in the backend project's Production environment:

| Variable | Value |
|---|---|
| `MONGODB_URI` | The Atlas connection string for the demo database. |
| `SESSION_SECRET` | A unique random secret. |
| `FRONTEND_ORIGINS` | The exact deployed frontend origin, with no trailing slash. Set it after the frontend deploy. |
| `ADMIN_EMAIL` | The demo administrator email. |
| `ADMIN_PASSWORD` | A demo password of at least 12 characters. |
| `ADMIN_NAME` | `Doctor Tracker Demo Admin` or another demo display name. |
| `NODE_ENV` | `production` |

Keep credentials in Vercel's environment settings and keep `.env` out of Git. Seed the demo administrator from a trusted local checkout with the same Atlas URI and admin settings in `backend/.env` by running `npm run seed:admin`.

Vercel Hobby is suitable for a small personal demonstration within its function limits. Its outbound IPs are dynamic; stable egress IPs require the paid Static IP feature. The Atlas IP access list must allow the backend to connect. For a disposable demo, a temporary allow-from-anywhere entry can work, but use a unique database password and remove the broad entry when it is no longer needed ([Vercel outbound IP guidance](https://vercel.com/kb/guide/can-i-get-a-fixed-ip-address), [Atlas connectivity troubleshooting](https://www.mongodb.com/docs/manual/troubleshooting/server-selection-timeout/)). Use synthetic records only; do not put real patient information in the demo database.

See the frontend repository README for the complete application architecture, user-facing screenshots, and submission URLs.
