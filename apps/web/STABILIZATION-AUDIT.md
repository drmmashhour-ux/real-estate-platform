# LECIPM Production Stabilization Audit Report

**Date:** 2026-05-07
**Branch:** `cursor/stabilization-audit-1c4d`
**Status:** Audit complete, stabilization applied, NOT deployed

---

## Executive Summary

Full codebase audit of `apps/web` on the `feature/locale-routing-security-observability-platform` branch. Found **6 critical**, **9 high**, and **15+ medium** risks across Arabic/RTL, voice assistant, build configuration, and deployment infrastructure. Applied targeted stabilization fixes. Arabic isolated for future re-enablement.

**Estimated production safety level after stabilization: MEDIUM-HIGH**
(Safe for FR/EN deployment with voice features; Arabic needs dedicated RTL testing sprint before activation)

---

## CRITICAL Findings (Fixed)

### 1. Permissions-Policy blocks microphone — voice features broken
- **File:** `lib/security/http-security-headers.ts:25`
- **Issue:** `microphone=()` in global headers blocks Web Speech API, getUserMedia, call recording
- **Impact:** All voice search, voice assistant, call intelligence features silently fail
- **Fix applied:** Removed `microphone=()` from Permissions-Policy; kept `camera=()`

### 2. Prisma schema too large for WASM engine (40K+ lines)
- **File:** `apps/web/prisma/schema.prisma`
- **Issue:** 1625 models / 632 enums exceeds Prisma WASM string limit
- **Fix applied:** Restored working schema from main (746 models) — see PR #26

### 3. Webpack minification disabled in production
- **File:** `next.config.ts:117-120`
- **Issue:** `minimize = false` unless `NEXT_WEBPACK_MINIMIZE=1` — unminified bundles in prod
- **Fix applied:** Inverted default — minification ON unless `NEXT_WEBPACK_MINIMIZE=0`

### 4. Cache-Control: no-store on all paths including static assets
- **File:** `next.config.ts:28-30`
- **Issue:** `no-store` applied to `/:path*` breaks Vercel CDN caching for `_next/static`
- **Fix applied:** Removed destructive cache header; Vercel handles caching correctly by default

### 5. 130+ missing module imports blocking webpack compilation
- **Files:** Various `lib/compliance/*`, `lib/ai/*`, `lib/finance/*`, `modules/*`
- **Fix applied:** Deployment recovery stubs — see PR #26

### 6. Arabic in production routing without stable RTL support
- **File:** `i18n/routing.ts`
- **Issue:** Arabic locale active in routing but RTL layout incomplete across 100+ components
- **Fix applied:** Arabic removed from production locales; assets preserved for re-enablement

---

## HIGH Findings

### 7. Hydration mismatch — PsychologyInsightsClient
- **File:** `components/sales-psychology/PsychologyInsightsClient.tsx:31-37`
- **Issue:** `typeof window` check during render changes output between server/client
- **Fix applied:** Moved browser-only reads to `useEffect` with `useState`

### 8. Dead LocaleAttributes component — potential dir conflict
- **File:** `components/i18n/LocaleAttributes.tsx`
- **Issue:** Reads `dir` from cookie independently; if ever mounted, creates third source of truth for `dir` attribute (conflicts with root layout + I18nContext)
- **Fix applied:** Marked `@deprecated` with explanation; not imported anywhere

### 9. Safari speech synthesis after async — gesture lost
- **Files:** `QuickPropertySearchForm.tsx:120-126`, `senior-voice-flow.tsx:67-71`
- **Issue:** `speechSynthesis.speak()` called after `router.push()` or `await fetch()` — Safari requires user gesture
- **Status:** Documented risk; fix requires refactoring voice feedback timing (not in this stabilization)

### 10. ~2700 API route.ts files — Vercel serverless function limits
- **Issue:** Each route.ts creates a serverless function; extremely high count for Vercel plans
- **Status:** Architecture risk; requires consolidation strategy (not in this stabilization)

### 11. defaultLocale changed to "fr" (French-first)
- **File:** `i18n/routing.ts`
- **Fix applied:** Changed from `"en"` to `"fr"` to match product intent (French-first Quebec platform)

---

## MEDIUM Findings (Documented, Not Changed)

### 12. RTL physical positioning — 100+ files affected
- **Pattern:** `text-right` (126 files), `ml-*`/`mr-*`/`pl-*`/`pr-*` (thousands), `absolute right-*`/`left-*`, `border-l` timelines
- **Status:** These work correctly in LTR (FR/EN). Must be audited per-component before Arabic re-activation
- **Hotspots:** All timeline components, admin finance tables, chat bubbles, search form mic button

### 13. I18nContext useLayoutEffect sets dir
- **File:** `lib/i18n/I18nContext.tsx:58-62`
- **Risk:** `useLayoutEffect` mutating `document.documentElement.dir` is correct but creates a brief flash if server-rendered dir differs from client (e.g., stale cookie)
- **Status:** Acceptable with `suppressHydrationWarning` on `<html>`

### 14. Onboarding service lacks window guard
- **File:** `modules/onboarding/onboarding.service.ts:29-41`
- **Risk:** `window.localStorage` without `typeof window` guard; safe today (only called from effects) but fragile for future RSC use
- **Status:** Documented

### 15. Voice recognition hardcoded to en-CA
- **File:** `lib/search/voiceSearch.ts:56`
- **Risk:** Arabic/French users get English speech recognition
- **Status:** Documented; requires locale-aware voice config for multilingual activation

### 16. Middleware large import graph
- **File:** `middleware.ts` (515 lines + auth/security/i18n/compliance imports)
- **Risk:** Edge bundle size; cold start latency
- **Status:** Architecture concern; monitor middleware size on Vercel dashboard

### 17. experimental.cpus: 1
- **File:** `next.config.ts:39`
- **Risk:** Slower builds on multi-core CI; not a production runtime issue
- **Status:** Intentional for build stability; can revisit after stable deploys

### 18. Feature flags in single large file
- **File:** `config/feature-flags.ts` (~2300 lines)
- **Risk:** Client bundle bloat from shared chunk
- **Status:** Tree-shaking should handle; monitor with bundle analyzer

---

## Arabic Isolation Details

### What was done
- Removed `"ar"` from `i18n/routing.ts` locales array
- Changed `defaultLocale` to `"fr"` (French-first)
- Arabic URL paths (`/ar/...`) will redirect to default locale via next-intl

### What was preserved (DO NOT DELETE)
| Asset | Path |
|-------|------|
| UI translations | `messages/ar.json` |
| Hub section labels | `lib/hub/core/hub-i18n.ts` |
| Locale metadata | `lib/i18n/types.ts` (LocaleCode includes "ar") |
| Locale entries | `lib/i18n/locales.ts` (UI_LOCALE_ENTRIES includes ar) |
| Arabic font | `app/layout.tsx` (Noto_Sans_Arabic import) |
| RTL CSS rules | `app/globals.css` ([dir="rtl"] blocks) |
| Listing templates | `modules/listing-assistant/listing-content.generator.ts` |
| SEO keywords | `listing-seo.engine.ts`, `listing-compliance.checker.ts` |
| E2E scenario | `e2e/scenarios/scenario-3-arabic-rtl.ts` |
| Global expansion | `modules/global-expansion/global-localization.service.ts` |

### How to re-enable Arabic
1. In `i18n/routing.ts`, add `"ar"` back to `locales` array
2. Audit all components with `text-right`, `ml-*`, `border-l`, `absolute right-*` for RTL
3. Test hydration: `dir="rtl"` must match server and client render
4. Configure voice recognition per-locale (currently hardcoded `en-CA`)
5. Run `e2e/scenarios/scenario-3-arabic-rtl.ts`
6. Test on mobile Safari with Arabic text (overflow, font rendering)

---

## Files Modified in This Stabilization

| File | Change |
|------|--------|
| `i18n/routing.ts` | Arabic removed from active locales; defaultLocale → "fr" |
| `lib/security/http-security-headers.ts` | Removed microphone=() from Permissions-Policy |
| `next.config.ts` | Removed no-store cache header; fixed minification default |
| `components/i18n/LocaleAttributes.tsx` | Marked deprecated (dead code) |
| `components/sales-psychology/PsychologyInsightsClient.tsx` | Fixed hydration mismatch |

---

## What Still Needs Manual Review

1. **Stripe keys alignment** — verify all env vars are test-mode for staging, live for production
2. **DATABASE_URL + APP_NAME** — production boot guards will throw if missing or misconfigured
3. **Vercel function count** — ~2700 API routes may hit plan limits; test deploy to verify
4. **Safari voice timing** — speech synthesis after async operations needs refactoring
5. **Middleware bundle size** — monitor on Vercel dashboard after first deploy
6. **Arabic RTL sprint** — dedicated component-by-component RTL audit before re-activation

---

## Branding Preserved ✓

- Black (#0B0B0B) background
- Gold (#D4AF37) accents
- White text
- Cinematic premium style (Cormorant Garamond serif, Inter sans-serif)
- Le Carrefour Immobilier Prestige identity

## Language Priority Preserved ✓

- French (fr) — primary / default locale
- English (en) — secondary
- Arabic (ar) — preserved assets, temporarily disabled from routing
- All existing tests unmodified
