# CARREFOUR IMMOBILIER — FULL PRODUCTION SYSTEM

This repo matches the **Full Production System** checklist:

| Area | Location |
|------|----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `lib/auth.ts` (`signToken` → `{ id, role }`), `lib/middleware.ts` (`verifyToken`) |
| Cookies | `cookie` package + `lib/cookie.ts` (`parse` / `serialize`) |
| Core APIs | `/api/property`, `/api/offer`, `/api/message`, `/api/sign` |
| AI | `/api/chat` (lazy OpenAI init so builds work without `OPENAI_API_KEY` in CI) |
| PDF | `lib/contracts.ts` — “REAL ESTATE CONTRACT - QUEBEC” |
| QC tax | `lib/finance.ts` — `welcomeTax` |
| Deal math | `lib/ai.ts` — `analyzeDeal` |
| Automation | `lib/automation.ts` — `closeDeal` |
| Stripe | `lib/stripe.ts` |
| UI | `app/page.tsx`, `app/properties`, `app/login`, `app/chat` |

**Deploy:** see **`docs/VERCEL.md`**.

**Test flow:** `npm run demo:flow` (after migrate + `JWT_SECRET` + dev server).
