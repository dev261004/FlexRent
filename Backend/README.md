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
| POST | `/auth/register` | No | Create a customer account |
| POST | `/auth/vendor/register` | No | Create a vendor account |
| POST | `/auth/login` | No | Log in and receive an access token |
| POST | `/auth/refresh` | Refresh cookie | Rotate refresh token and receive a new access token |
| POST | `/auth/logout` | Refresh cookie | Revoke refresh token and clear cookie |
| GET | `/auth/me` | Bearer token | Get current user profile |
| PUT | `/auth/profile` | Bearer token | Update profile fields |

The same routes are also available under `/api/auth`.

## Roles

- `CUSTOMER`: portal user created by `/auth/register`.
- `VENDOR`: vendor signup requires company, product category, and GST number.
- `ADMIN`: no public signup route. Create a normal user first, then manually change the role in the database for now.

## Signup Validation

- Email must be valid and unique.
- Password must be 6-12 characters.
- Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.
- Password and confirm password must match.
Raw passwords are never stored. The API stores only bcrypt password hashes.

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
