# Rental Management — Backend (Auth Module)

## Setup

```bash
npm install
cp .env.example .env   # fill in real DATABASE_URL and JWT secrets
npx prisma migrate dev --name init
npm run dev
```

Server runs on `http://localhost:5000` by default. Health check: `GET /api/health`.

## Auth Endpoints

| Method | Route | Auth required | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create a new CUSTOMER account |
| POST | `/auth/login` | No | Log in, returns access token + sets refresh cookie |
| POST | `/auth/refresh` | Refresh cookie | Rotates tokens, returns new access token |
| POST | `/auth/logout` | Refresh cookie | Invalidates refresh token |
| GET | `/auth/me` | Bearer token | Get current user profile |
| PUT | `/auth/profile` | Bearer token | Update name/phone/profileImage |

## How tokens work

- **Access token**: short-lived (15 min), sent in `Authorization: Bearer <token>` header on every protected request. Frontend stores this in memory/state — NOT localStorage (XSS risk).
- **Refresh token**: long-lived (7 days), stored as an `httpOnly` cookie automatically. The browser sends it automatically to `/auth/refresh`. Frontend never touches it directly.
- When an API call returns 401, frontend should call `POST /auth/refresh` (credentials: 'include') to get a new access token, then retry the original request.

## Using the middleware in new routes

```ts
import { verifyJWT, requireRole } from "../middleware/auth.middleware";

// Any logged-in user
router.get("/orders", verifyJWT, getMyOrders);

// Admin only
router.post("/products", verifyJWT, requireRole(["ADMIN"]), createProduct);
```

## Frontend integration notes

- Copy `src/types/auth.types.ts` into the frontend repo (or extract into a shared package) so both sides use identical request/response shapes.
- CORS is configured with `credentials: true` — frontend fetch/axios calls MUST set `credentials: 'include'` for the refresh cookie to work.
- All error responses follow: `{ success: false, message: string, errors?: Record<string,string> }`.
- All success responses from `/auth/*` return the shapes defined in `auth.types.ts` (e.g. `LoginResponse`, `MeResponse`).

## Next modules to build on this foundation

Product & Pricelist → Cart/Order/Quotation → Payment & Deposit → Late Fee Engine → Pickup/Return → Dashboard Analytics (see full plan in chat).
