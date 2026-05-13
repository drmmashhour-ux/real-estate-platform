# Routing and Locale Stability

Status: preview-safe hardening. No route redesign, merge, or deployment was performed.

## Findings

| Issue                                                                                   | Severity | Affected modules       | Recommended fix strategy                                                                                        | Status       |
| --------------------------------------------------------------------------------------- | -------- | ---------------------- | --------------------------------------------------------------------------------------------------------------- | ------------ |
| Server locale did not honor launch locale allowlist before rendering `<html lang dir>`. | High     | Core, locale, Syria    | Clamp `resolveInitialLocale` result to `localeAllowListFromFlags` before rendering and provider initialization. | Fixed now.   |
| Middleware does not normalize or clear invalid locale cookies.                          | Medium   | Locale, routing        | Add optional middleware locale normalization after SSR/client behavior is verified.                             | Postponed.   |
| FR-first routing is not implemented as route structure.                                 | Medium   | Locale, marketing, SEO | Define whether FR-first means default copy, canonical URLs, hreflang, or locale-prefixed paths.                 | Postponed.   |
| Syria mode is behaviorally isolated, not route-isolated.                                | Medium   | Syria, BNHub, payments | Keep manual payments/contact-first behavior; consider host or market guard if stronger isolation is required.   | Postponed.   |
| `/admin/settings` exists while config redirects to `/admin/controls`.                   | Low      | Admin                  | Add route manifest check before deleting or repurposing.                                                        | Postponed.   |
| `/listings/not-found` is a literal route, not framework `not-found.tsx`.                | Low      | Homes, routing         | Rename only with route QA.                                                                                      | Postponed.   |
| Root and global route error boundaries are missing.                                     | Medium   | Core, all routes       | Add root `error.tsx` / `global-error.tsx` after Next 16 docs review and visual QA.                              | Postponed.   |
| Staging public browse allowlist is narrow.                                              | Low      | Routing, staging       | Keep homepage/listings/BNHub explicit; expand only when QA requires marketing routes public.                    | Tests added. |
| Internal API route protection is not enforced by middleware.                            | Medium   | Admin, growth, BNHub   | Standardize internal auth helper and add route protection inventory.                                            | Postponed.   |

## Locale behavior after hardening

- `resolveInitialLocale` still resolves cookie, user preference, market suggestion, then English.
- Root layout now clamps that value to launch flags before setting `lang`, `dir`, Arabic font, and `AppProviders.initialLocale`.
- Client provider continues to enforce the same allowlist.
- Arabic/Syria preview remains isolated by market behavior; no public production enablement was performed.

## Tests added

- `lib/launch/resolve-launch-flags.test.ts`
- `lib/routing/public-browse-paths.test.ts`
- `lib/demo-mode-allowlist.test.ts`
