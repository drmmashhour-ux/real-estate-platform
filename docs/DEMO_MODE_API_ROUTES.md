# DEMO_MODE — API write protection

When `DEMO_MODE=true` (or `1`) on the server:

1. **Middleware** (`apps/web/middleware.ts`) intercepts **POST, PUT, PATCH, DELETE** to `/api/*` **before** any route handler runs.
2. The allowlist lives in **`apps/web/lib/demo-mode-allowlist.ts`** (Edge-safe, no Prisma). `lib/demo-mode-api.ts` adds `blockIfDemoWrite()` for Node route handlers.
3. Requests **not** in the allowlist receive **403** with body `{ "error": "Demo mode — this action is disabled", "code": "DEMO_MODE" }`.
4. The client shows a **toast** via `DemoModeFetchToast` when `code === "DEMO_MODE"` (see `components/demo/DemoModeFetchToast.tsx`).

Route handlers can add **defense in depth** with:

```ts
import { blockIfDemoWrite } from "@/lib/demo-mode-api";

export async function POST(req: NextRequest) {
  const blocked = blockIfDemoWrite(req);
  if (blocked) return blocked;
  // ...
}
```

## Allowlist (mutations permitted in DEMO_MODE)

Defined in `lib/demo-mode-allowlist.ts`:

| Path | Methods | Purpose |
|------|---------|---------|
| `/api/auth/login` | POST | Sign in |
| `/api/auth/logout` | POST | Sign out |
| `/api/auth/staging-demo-login` | POST | One-click staging demo |
| `/api/auth/demo-session` | POST | Dev demo impersonation |
| `/api/auth/password-reset` | POST | Password reset flow |
| `/api/admin/demo/generate-user` | POST | Admin creates tester (still requires ADMIN session) |
| `/api/feedback` | POST | Feedback widget (includes nested paths under `/api/feedback/`) |
| `/api/internal/demo-event` | POST | Internal `blocked_action` logging (Bearer `CRON_SECRET`) |
| `/api/cron/reset-demo` | GET, POST | Daily staging DB reset (Bearer `CRON_SECRET`) |
| `/api/admin/demo/reset` | POST | Manual reset (admin session) |
| `/api/demo/track` | POST | Staging `page_view` / feature pings |
| `/api/offers` | POST, PATCH, GET | Listing offer workflow (includes `/api/offers/draft`, `/api/offers/[id]`, `/api/offers/[id]/status`, `/api/offers/[id]/counter`, `/api/offers/[id]/notes`, `/api/offers/[id]/submit`) |
| `/api/my/offers` | GET | Buyer’s offers |
| `/api/broker/offers` | GET | Broker offer inbox |

**Not** allowed (blocked): `/api/auth/register`, `/api/auth/register-mortgage-broker`, Stripe webhooks, most cron jobs, listings mutations, deals, contracts, payments, most admin POSTs, etc.

**Exception:** `/api/cron/reset-demo` is allowlisted so the daily job can run even when `DEMO_MODE` is on.

## DELETE endpoints (files)

These **DELETE** handlers are blocked by middleware like any other mutation. Listed for audits:

- `app/api/investor/portfolio/[id]/route.ts`
- `app/api/admin/spell-dictionary/route.ts`
- `app/api/admin/finance/tax/[id]/route.ts`
- `app/api/admin/case-studies/[id]/route.ts`
- `app/api/admin/incentives/[id]/route.ts`
- `app/api/admin/testimonials/[id]/route.ts`
- `app/api/admin/market-data/route.ts`
- `app/api/admin/welcome-tax/[id]/route.ts`
- `app/api/projects/[id]/route.ts`
- `app/api/projects/saved-searches/route.ts`
- `app/api/projects/alerts/route.ts`
- `app/api/projects/favorites/route.ts`
- `app/api/broker/listings/[id]/access/route.ts`

## Coverage note

There are **hundreds** of `POST` route modules under `app/api/`. The middleware provides **global** coverage without editing each file. Critical routes may still call `blockIfDemoWrite(req)` for redundancy.

## Manual QA (DEMO_MODE on)

- [ ] Delete listing / project → **403** + toast
- [ ] Edit profile (POST to a blocked API) → **403** + toast
- [ ] Create deal / transaction → **403** + toast
- [ ] Admin destructive action → **403** + toast
- [ ] Login / logout / staging demo login → **works**
- [ ] Admin “Generate test user” on `/admin/demo` → **works** (allowlisted)
