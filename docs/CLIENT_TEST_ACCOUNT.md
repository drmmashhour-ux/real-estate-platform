# Client test accounts (UAT)

Clients sign in at **`/auth/login`** with email + password. New signups must **verify email** before login; for demos and UAT it is easier to use a **pre-verified** account you create on the server.

## Option A — One-off account (staging or production DB)

From `apps/web`, with `DATABASE_URL` set to the **same** database the deployed app uses:

```bash
cd apps/web
export DATABASE_URL="postgresql://..."   # if not already in .env
export CLIENT_TEST_EMAIL="client.demo@yourdomain.com"
export CLIENT_TEST_PASSWORD='YourStrongPasswordHere9!'
npm run client:test-user
```

- Creates or **updates** that user: password reset, `emailVerifiedAt` set, role `USER`.
- **Share the password** with the client via a password manager, encrypted email, or call — not in a public chat.

You can run the same command against production from a secure machine when you have DB access (Neon/Supabase shell, etc.).

## Option B — Local / dev database after seed

After `npm run seed` (or `npx prisma db seed`), demo users exist:

| Email | Password | Notes |
|-------|----------|--------|
| `guest@demo.com` | `DemoGuest2024!` | General USER |
| `demo@platform.com` | `Demo123!` | **TESTER** — use for client UAT flows |

They are **email-verified** in seed so login works. Use only on **development/staging** databases.

Staging one-click demo (no password) is documented in **[STAGING_ENVIRONMENT.md](./STAGING_ENVIRONMENT.md)** (`STAGING_DEMO_LOGIN`, `/api/auth/staging-demo-login`).

## Security notes

- Rotate or delete UAT accounts when testing ends.
- Prefer a dedicated address like `uat+client@yourdomain.com` or a real client inbox they control.
- Demo sign-in shortcuts that only work in development are separate; see `lib/auth/demo-auth-allowed.ts`.
