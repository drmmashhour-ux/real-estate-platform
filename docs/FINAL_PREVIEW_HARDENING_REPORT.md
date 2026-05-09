# LECIPM Final Preview Hardening Report

**Date:** 2026-05-09
**Branch:** `cursor/production-stable-recovery-1c4d`
**Status:** NOT deployed. NOT merged.

---

## 1. Runtime Risks

| Risk | Severity | Guard |
|------|----------|-------|
| Placeholder DATABASE_URL at runtime | Blocked | `lib/db/prisma.ts` throws if URL contains "placeholder" |
| Missing Supabase keys | Low | Auth pages render, operations fail gracefully |
| Missing Stripe keys | Low | Warning logged at startup, payment routes return error |
| Unknown compliance action | Blocked | `compliance/server/checks.ts` fails closed |

## 2. Build Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| OOM during TypeScript check | Medium | `NODE_OPTIONS=--max-old-space-size=16384` in `vercel.json` |
| Services running prisma generate | Eliminated | Skipped in CI/Vercel |
| Prisma schema validation | None | Schema valid, 746 models, v6.19.3 |

## 3. Memory Assessment

- Webpack compilation: succeeds at 8GB in ~4.1 minutes
- TypeScript check: requires ~12-16GB
- Vercel Pro provides 16GB dedicated heap
- No static generation (all dynamic rendering)
- 669 pages + 1519 API routes = moderate footprint

## 4. API Stability

- `/api/ready`: **200** (verified)
- API routes use standard Next.js App Router handlers
- No API route imports from services/* or apps/syria
- Stripe API routes degrade safely when keys missing

## 5. Middleware Stability

- next-intl middleware handles locale routing
- Middleware warning ("deprecated, use proxy") is cosmetic — Next.js 16 still supports it
- No redirect loops detected
- Admin routes redirect to login (307) — correct behavior

## 6. Locale Stability

- Main branch does NOT use [locale] prefix routing
- Routes work at root level: `/`, `/bnhub`, `/search`, etc.
- French-first content in existing pages
- English supported
- Arabic: not configured on main (future)

## 7. Prisma Runtime Assessment

- Schema: valid, 746 models
- Client: v6.19.3, generates cleanly
- Runtime guard: active (blocks placeholder URL)
- No Prisma connection during build
- Postinstall: safe with placeholder fallback

## 8. Feature Flag Assessment

| Flag | Default | Preview Impact |
|------|---------|---------------|
| FEATURE_HOMES | ON | Marketplace active |
| FEATURE_BNHUB | ON | BNHub active |
| FEATURE_IMMOCONTACT | ON | Contact active |
| FEATURE_GROWTH | ON | SEO pages active |
| FEATURE_COMPLIANCE | ON | Fail-closed guards active |
| FEATURE_INVEST | OFF | Investor tools hidden |
| FEATURE_FORMS | OFF | Legal forms hidden |
| FEATURE_DR_BRAIN | OFF | Admin intelligence hidden |
| FEATURE_DESIGN_SYSTEM | OFF | Dev tools hidden |

## 9. Disabled Systems

| System | Reason | Re-enable |
|--------|--------|-----------|
| Invest | Beta | `FEATURE_INVEST=1` |
| Forms | Beta | `FEATURE_FORMS=1` |
| Dr Brain | Internal | `FEATURE_DR_BRAIN=1` |
| Stripe payments | No keys | Set `STRIPE_SECRET_KEY` |
| Supabase auth | No keys | Set Supabase env vars |

## 10. Preview-Safe Systems

| System | Status | Verified |
|--------|--------|----------|
| Homepage | ✅ 200 | Yes |
| Login/Register | ✅ 200 | Yes |
| About Platform | ✅ 200 | Yes |
| Search | ✅ 200 | Yes |
| Properties | ✅ 200 | Yes |
| Marketplace | ✅ 200 | Yes |
| Mortgage | ✅ 200 | Yes |
| BNHub | ✅ 200 | Yes |
| BNHub Stays | ✅ 200 | Yes |
| BNHub Login | ✅ 200 | Yes |
| BNHub Host Dashboard | ✅ 200 | Yes |
| Contact | ✅ 200 | Yes |
| Admin | ✅ 307 redirect | Yes |
| Broker | ✅ 200 | Yes |
| Owner | ✅ 200 | Yes |
| API Ready | ✅ 200 | Yes |

## 11. Recommended First Preview Tests

After Vercel preview deploys:
1. Load `/` — confirm homepage renders
2. Load `/bnhub` — confirm BNHub renders
3. Load `/search` — confirm search page renders
4. Load `/contact` — confirm contact form renders
5. Load `/api/ready` — confirm API responds
6. Check browser console for errors
7. Check Vercel function logs for runtime errors
8. Verify no "placeholder" appears in any log

## 12. Recommended Monitoring Strategy

- Vercel dashboard: monitor build time and function errors
- Browser: check console for hydration warnings
- `/api/ready`: ping every 5 minutes
- Vercel logs: filter for `[LECIPM]` prefix errors

## 13. Estimated Preview Deployment Success Probability

**90%**

The 10% risk is:
- Vercel 16GB may not be sufficient for TypeScript check (unlikely but possible)
- Unknown Vercel-specific env behavior difference

## 14. Decisions

**Preview deployment: SAFE**

**Production deployment: NOT SAFE**
(Needs: env verification on live Vercel, Stripe test-mode confirmation, compliance review, real user testing on preview first)

---

**Nothing deployed. Nothing merged. Report complete.**
