# Store release & scaling (first 1k users)

Operational playbook for **LECIPM** mobile (`apps/mobile`). Code lives beside this doc (`app.config.ts`, `eas.json`, signup `invite` / `ref` params).

---

## Phase 1 — App release (Expo / stores)

1. **Assets** — Add before public store submit (see `assets/README.md`):
   - `assets/icon.png` (1024×1024)
   - `assets/adaptive-icon.png` (Android foreground)
   - `assets/splash.png`
   - `assets/notification-icon.png` (Android, monochrome)
   - Optional ASO frames: `pnpm run store-screenshots:generate` → `assets/store-screenshots/`
   - Listing copy: `STORE_LISTING_DRAFT.md`

2. **EAS project** — In `apps/mobile`:
   - `npm i -g eas-cli` → `eas login` → `eas init`
   - Set `EAS_PROJECT_ID` in EAS secrets or local env for prebuild; mirror in `app.config.ts` via env at build time.

3. **Production env** (EAS dashboard **Secrets** or `eas.json` env — never commit secrets):
   - `EXPO_PUBLIC_API_BASE_URL` — HTTPS API origin (same as web app serving `/api/*`).
   - `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_MOBILE_DEEP_LINK_SCHEME` — default `lecipm`; must match web `NEXT_PUBLIC_MOBILE_*_SCHEME` for Stripe return URLs.

4. **Build**
   - Internal / QA: `pnpm run eas:build:preview:ios` or `eas:build:preview:android`
   - Store: `pnpm run eas:build:production:ios` / `eas:build:production:android`

5. **Submit**
   - Apple: App Store Connect — privacy policy URL, support URL, encryption compliance (app sets `ITSAppUsesNonExemptEncryption: false` unless you use custom crypto).
   - Google: Play Console — Data safety, content rating, target API level (Expo manages most).

6. **Submit CLI** (after credentials): `pnpm run eas:submit:ios` / `eas:submit:android`

---

## Phase 2 — Soft launch (20–50 users)

- Run `pnpm run validate:bnhub:readiness` on **apps/web** with real `.env`.
- Hit `GET /api/ready/soft-launch` on production.
- Seed Supabase listings (`docs/supabase-soft-launch-seed.sql` or real inventory).
- Pilot cohort: collect **booking → pay → confirm** with Stripe test/live as appropriate.

---

## Phase 3 — User acquisition (content & community)

- Ship **deep links**: `lecipm://` (+ legacy `bnhubguest://` if needed) + Universal Links / App Links (configure in Apple + Google consoles; paths documented in web env examples).
- Track **funnel** via existing APIs (`/api/mobile/v1/bnhub/track/*`, booking funnel events).
- Social: link to **web city SEO pages** + in-app browse; UTM params on web → app install campaigns (measure outside app).

---

## Phase 4 — Host acquisition

- Onboard hosts: set `listings.host_user_id` to Supabase Auth UUID.
- Host uses mobile **host** routes + web dashboard as needed.
- **Stripe Connect** (when enabled): complete `stripe_connect_account_id` per listing extensions SQL.

---

## Phase 5 — Conversion (UX + trust)

- Keep **guest instructions** and **paid-only** sensitive fields (already server-enforced).
- Surface **reviews**, **verification badges**, and **clear totals** on booking summary (iterate in UI).
- Use **`BNHUB_CHECKOUT_ITEMIZED_FEES`** only when pricing copy is ready for guests.

---

## Phase 6 — Retention (notifications & alerts)

- **Push**: `expo-notifications` + `POST /api/mobile/bnhub/devices` (requires `EAS_PROJECT_ID`).
- **In-app**: price watches, discovery alerts, saved searches (`/api/mobile/v1/bnhub/*`).

---

## Phase 7 — Referral (invite system)

- **App**: Sign-up accepts `?invite=` or `?ref=` — stored as Supabase `user_metadata.invite_code` (wire rewards server-side when ready).
- Share links: `https://your.app/(auth)/sign-up?invite=PARTNERCODE` (adjust host for universal links).

---

## Phase 8 — Monetization

- Tune **service fee BPS** and upsells via web env (`BNHUB_*` in `apps/web/.env.example`).
- **Insurance leads**: existing web/mobile lead forms + `/api/insurance/leads`; align copy with compliance.

---

## Scaling checklist (1000+ users)

- [ ] Production API autoscaling / DB pooler (e.g. Supavisor) configured.
- [ ] Rate limits reviewed on `checkout`, `bookings/create`, `auth`.
- [ ] Stripe webhook **idempotency** verified under load.
- [ ] Error monitoring (Sentry, etc.) on web + optional Expo crash reports.
- [ ] Privacy policy + delete-account path published (store requirement).
