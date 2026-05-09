# Module Ownership

Each module lives at `apps/web/src/modules/<name>/`. Routes live in `apps/web/app/`.

| Module | Owner Path | Status | Primary Routes | Feature Flag | Key Models | Dependencies |
|---|---|---|---|---|---|---|
| **Core** | `src/modules/core/` | Active | `/`, `/login`, `/register`, `/billing`, `/account` | `FEATURE_CORE` (always on) | `User`, `Session`, `PlatformCodeSequence`, `WorkspaceAuditLog` | Prisma, design-system |
| **Homes** | `src/modules/homes/` | Active | `/search`, `/listings/[id]`, `/sell`, `/buy`, `/broker`, `/mortgage` | `FEATURE_HOMES` (default ON) | `Listing`, `Property`, `Lead`, `Offer`, `Transaction`, `RealEstateTransaction` | Core, Compliance, ImmoContact |
| **BNHub** | `src/modules/bnhub/` | Active | `/bnhub`, `/bnhub/stays`, `/host`, `/stays` | `FEATURE_BNHUB` (default ON) | `BnhubStay`, `Booking`, `Payment`, `Review`, `HostQuality`, `ReferralProgram` | Core, Stripe, Compliance |
| **Invest** | `src/modules/invest/` | Beta | `/invest`, `/analysis`, `/watchlist`, `/evaluate` | `FEATURE_INVEST` (default OFF) | `DealAnalysis`, `PortfolioSnapshot`, `InvestorAlert`, `WatchlistItem` | Core, Homes |
| **Forms** | `src/modules/forms/` | Beta | `/forms`, `/contracts`, `/client-documents`, `/legal/seller-declaration-property` | `FEATURE_FORMS` (default OFF) | `Contract`, `SignatureEnvelope`, `SellerDeclaration`, `LegalForm` | Core, Compliance, Homes |
| **ImmoContact** | `src/modules/immocontact/` | Active | `/contact`, `/messages`, `/embed/ai-chat` | `FEATURE_IMMOCONTACT` (default ON) | `Conversation`, `Message`, `LeadCommMessage`, `LeadScore` | Core, AI layer |
| **Compliance** | `src/modules/compliance/` | Active | `/compliance` (admin), middleware in Homes/Forms/BNHub | `FEATURE_COMPLIANCE` (default ON) | `ComplianceAudit`, `ComplianceRule`, `RiskSeverity` | Core, Prisma |
| **DrBrain** | `src/modules/dr-brain/` | Internal | `/admin`, `/admin/dr-brain`, `/admin/trustgraph`, `/admin/monitoring` | `FEATURE_DR_BRAIN` (default OFF) | `AdminAuditLog`, `SystemValidation`, `FraudAlert`, `TrustScore` | Core, all other modules |
| **Admin** | `app/admin/` | Active | `/admin/*` (controls, finance, analytics, users) | — | Shared with DrBrain and Core | Core, DrBrain |
| **Growth** | `src/modules/growth/` | Active | `/growth/*` | — | — | Core |
| **Design System** | `src/modules/design-system/` | Internal | `/dev/hub-atlas` (dev only) | `FEATURE_DESIGN_SYSTEM` (default OFF) | None (pure UI library) | Tailwind CSS |

## Notes

- **Admin** does not have its own `src/modules/admin/` directory; admin routes live directly in `app/admin/` and share models with Core and DrBrain.
- **Growth** contains marketing components (`EmailCapture`, `MarketingPageViewTracker`) but does not have a dedicated feature flag — it is always available.
- Feature flags are defined in `src/lib/env/features.ts`. Set via environment variables (`1`/`true` to enable, `0`/`false` to disable).
- Hub definitions (status, audience, routes) are the single source of truth in `src/config/hubs.ts`.
