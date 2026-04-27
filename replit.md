# BNI Web

A multi-role chapter management system (Super Admin, President, Vice President, Coordinator, Captain, Members).

## Tech Stack
- **Frontend:** React 19 + Vite 8 + React Router 7
- **Backend:** Node.js + Express 4 + Mongoose 8 (MongoDB Atlas)
- **Auth:** WhatsApp + Email OTP, then password (bcrypt) + JWT (7-day)
- **Mail/OTP services:** Nodemailer SMTP, Neophron WhatsApp template API

## Project Structure
- `server/` — Express backend
  - `index.js` — entry, listens on `BACKEND_PORT` (default 3001) on localhost
  - `db.js` — MongoDB Atlas connection
  - `seed.js` — auto-seeds the first Super Admin from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PHONE`
  - `models/` — User, Chapter, PowerTeam, Meeting, Otp
  - `routes/` — `auth`, `chapters`, `users`, `power-teams`, `meetings`, `dashboard`
  - `services/` — `whatsappOtp`, `emailOtp`, shared `otp` (issue + verify, hashed)
  - `middleware/auth.js` — `requireAuth`, `requireRole`
  - `utils/jwt.js`
- `src/` — React frontend
  - `pages/` — `Login`, `VerifyOtp`, `SetPassword`, `ForgotPassword`, plus role dashboards
  - `components/Layout.jsx`, `ProtectedRoute.jsx`
  - `context/AuthContext.jsx` — token storage, role-based redirect
  - `api/client.js` — axios instance using `/api` (proxied to backend in dev)
- `vite.config.js` — host `0.0.0.0`, port `5000`, `allowedHosts: true`, `/api` proxied to backend

## Development
- `npm run dev` runs server (port 3001) and Vite (port 5000) together via `concurrently`.
- Workflow: **Start application** runs `npm run dev`.

## Auth Flow
1. User enters phone or email → `/api/auth/request-otp` (sends OTP via WhatsApp + Email).
2. User enters code → `/api/auth/verify-otp`.
3. First time: backend returns `setupToken` → user sets password on `/set-password`.
4. Next logins: choose **Password** tab on `/login` → `/api/auth/login-password`.
5. Forgot password: same OTP flow with `purpose=reset_password`.

## Roles & Routes
- `super_admin` → `/admin/*` (Dashboard, Chapters, Users, Power Teams)
- `president` → `/president`
- `vice_president` → `/vp`
- `coordinator` → `/coordinator/*` (Dashboard, Power Teams)
- `captain` / `vice_captain` / `member` → `/me`

## Environment Variables
**Secrets (set in Replit Secrets):**
- `MONGODB_URI`, `JWT_SECRET`
- `NEO_OTP_TEMPLATE_TOKEN`, `EMAIL_PASS`
- `SUPER_ADMIN_PHONE`, `SUPER_ADMIN_EMAIL` (used to seed the first super admin)

**Shared env vars:**
- `NEO_OTP_WHATSAPP_URL`, `NEO_OTP_TEMPLATE_NAME`, `NEO_OTP_TEMPLATE_LANGUAGE`, `NEO_OTP_TEMPLATE_BUTTON_INDEX`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_FROM`, `EMAIL_ENCRYPTION`, `EMAIL_MAILER`
- `BACKEND_PORT` (default 3001), `OTP_EXPIRY_MINUTES` (default 5)

## Deployment
Configured as **Autoscale**:
- Build: `npm run build`
- Run: `npm run start` (serves backend; static frontend served by separate `vite preview` or via reverse-proxy depending on host setup — for Replit Deployments, the backend serves on port 5000 in production)
