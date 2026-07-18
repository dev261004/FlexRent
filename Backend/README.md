# Rental Management - Backend Auth Module

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init_auth
npm run dev
```

Server runs on `http://localhost:5000` by default.

Health check:

```http
GET /api/health
```

## Auth Endpoints

| Method | Route | Auth required | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create a customer, vendor, or guarded admin account |
| POST | `/auth/login` | No | Log in and receive an access token |
| POST | `/auth/refresh` | Refresh cookie | Rotate refresh token and receive a new access token |
| POST | `/auth/logout` | Refresh cookie | Revoke refresh token and clear cookie |
| GET | `/auth/me` | Bearer token | Get current user profile |
| PUT | `/auth/profile` | Bearer token | Update profile fields |

The same routes are also available under `/api/auth`.

## Roles

- `CUSTOMER`: portal user. The API also accepts `USER` and stores it as `CUSTOMER`.
- `VENDOR`: vendor signup requires company, product category, and GST number.
- `ADMIN`: admin signup requires `ADMIN_REGISTRATION_KEY`.

## Signup Validation

- Email must be valid and unique.
- Password must be unique.
- Password must be 6-12 characters.
- Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.
- Password and confirm password must match.

Password uniqueness is enforced with a secret HMAC fingerprint. Raw passwords are never stored.

## Token Flow

- Access token: short lived, sent in `Authorization: Bearer <token>`.
- Refresh token: stored in an `httpOnly` cookie and rotated on `/auth/refresh`.
- Frontend requests that rely on the refresh cookie must send credentials.

```ts
fetch("/api/auth/refresh", {
  method: "POST",
  credentials: "include",
});
```

## Next Modules

Product & Pricelist -> Cart/Order/Quotation -> Payment & Deposit -> Late Fee Engine -> Pickup/Return -> Dashboard Analytics.
