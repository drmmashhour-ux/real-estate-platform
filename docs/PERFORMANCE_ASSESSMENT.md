# Performance Assessment

Status: preview-safe assessment. No behavior-changing performance refactors were made.

## Key risks

| Area                       | Severity | Evidence                                                                                                            | Safe strategy                                                                                | Status                                         |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Oversized client bundles   | Medium   | Large client routes include BNHub search, investment analysis, seller wizard, and admin clients.                    | Split into route-local subcomponents only after visual/E2E coverage.                         | Postponed.                                     |
| Global provider fan-out    | Medium   | Root `AppProviders` mounts analytics, demo, toasts, compare, assistant, product health, and widgets for all routes. | Group providers and lazy-mount non-critical widgets by route segment.                        | Postponed.                                     |
| Locale multiplication      | Medium   | `en`, `fr`, `ar`, plus separate `/fr/legal` pages.                                                                  | Keep locale allowlist consistent server/client; later define canonical legal URL strategy.   | Partially fixed: server locale clamping added. |
| Static generation pressure | Medium   | Multiple `generateStaticParams` routes, including city, buy/rent, blog, mortgage, and features.                     | Keep DB optional in static params; add route manifest and build-time page budget.            | Postponed.                                     |
| Middleware POST JSON scan  | Medium   | Middleware reads JSON API POST bodies to block raw card payloads.                                                   | Document payload limits; consider route-level validation or size caps after security review. | Test coverage added for raw card detection.    |
| Admin route DB pressure    | Medium   | Admin layout is dynamic and checks Prisma on navigation.                                                            | Cache low-risk admin shell metadata after auth behavior is covered.                          | Postponed.                                     |
| `@lecipm/ui` stub          | Low      | Shared package exports no real primitives while web uses `components/ui`.                                           | Keep mature primitives in app-level barrel; avoid moving stubs into runtime bundles.         | Fixed now: app-level UI barrel/README.         |
| TypeScript memory pressure | Medium   | Web typecheck uses 8 GB heap and broad app include patterns.                                                        | Add project references only after module boundaries stabilize.                               | Postponed.                                     |

## Low-risk changes applied

- Clamped root layout locale to launch flags to avoid server/client mismatch and unnecessary Arabic shell work when Arabic is disabled.
- Added `components/ui/index.ts` as a narrow design-system entrypoint for stable primitives.
- Added fast guard tests so safety checks can run without building or launching the UI.

## Postponed optimizations

- Bundle analyzer wiring.
- Provider split by route group.
- Removing global `Cache-Control: no-store`.
- Reducing city/growth static route generation.
- Large client component decomposition.
- Reworking middleware body scanning.
