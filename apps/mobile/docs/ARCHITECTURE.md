# Mobile architecture (LECIPM)

## Principles

1. **API-first:** All business rules live on the server (`apps/web` API routes). Mobile **does not** import `apps/web/lib`.
2. **Central clients:** Use `src/services/apiClient.ts` (and `api.ts`) for HTTP; extend with interceptors/auth as needed.
3. **Domain services:** `bookingService.mobile.ts`, `listingService.mobile.ts`, `hostCalendarService.mobile.ts`, etc. map screens to endpoints.
4. **Auth:** `auth.ts`, `authService.mobile.ts` — session/storage must not leak secrets to logs.
5. **AI:** `services/ai.ts` — calls web AI endpoints; no duplicated scoring logic on device.
6. **Theme:** Align with premium black/gold where the mobile shell mirrors BNHub (see `src/theme/`).
7. **Locales:** `src/locales/` — mirror keys with web where possible; RTL for Arabic when that locale is active.

## Hub / BNHub

- Shared **types** for hub tabs: `src/lib/hub-mobile-types.ts` (aligned with web Hub Engine mobile types).

## Testing

- Prefer integration tests against staging APIs for critical flows; unit-test pure helpers locally.
