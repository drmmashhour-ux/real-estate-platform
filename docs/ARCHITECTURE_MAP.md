# Architecture Map

## Monorepo Layout

```
lecipm-platform/
├── apps/
│   ├── web/                  # Main LECIPM platform (Next.js 16)
│   ├── syria/                # Syria/SYBNB platform (isolated)
│   ├── admin/                # Admin dashboard app
│   ├── mobile/               # React Native mobile app
│   ├── broker-dashboard/     # Broker-specific dashboard
│   ├── owner-dashboard/      # Owner-specific dashboard
│   └── ...                   # Other app shells
├── packages/
│   ├── db/                   # Shared database utilities
│   ├── ui/                   # Shared UI component library
│   ├── config/               # Shared configuration
│   ├── types/                # Shared TypeScript types
│   ├── auth/                 # Shared auth utilities
│   └── ...                   # Other shared packages
├── services/
│   ├── auth-service/         # Authentication microservice
│   ├── booking-service/      # Booking management
│   ├── listing-service/      # Listing CRUD & search
│   ├── messaging-service/    # Real-time messaging
│   ├── payment-service/      # Stripe payment processing
│   ├── review-service/       # Review & rating management
│   ├── search-service/       # Search indexing & queries
│   ├── trust-safety/         # Trust scoring & fraud detection
│   ├── user-service/         # User profile management
│   └── ...                   # AI services, analytics, etc.
├── modules/                  # Standalone module packages
├── infrastructure/           # Docker, deployment configs
├── scripts/                  # Build, seed, validation scripts
└── docs/                     # Documentation
```

## apps/web Internal Structure

```
apps/web/
├── app/                      # Next.js App Router (pages + API routes)
│   ├── api/                  # ~1519 API route handlers
│   ├── (auth)/               # Auth-grouped routes
│   ├── (dashboard)/          # Dashboard-grouped routes
│   ├── admin/                # Admin pages
│   ├── bnhub/                # BNHub pages
│   ├── broker/               # Broker pages
│   ├── listings/             # Listing pages
│   └── ...                   # ~103 top-level route directories
├── components/               # Shared React components
├── lib/                      # Utilities, API clients, helpers
│   ├── db/                   # Prisma client singleton
│   └── ...
├── modules/                  # Top-level module extensions
├── src/
│   ├── modules/              # Primary module codebase (80+ modules)
│   │   ├── core/             # Auth, users, platform shell
│   │   ├── homes/            # Real estate marketplace
│   │   ├── bnhub/            # Short-term stays
│   │   ├── invest/           # Investor tools
│   │   ├── forms/            # Legal forms
│   │   ├── immocontact/      # Communication hub
│   │   ├── compliance/       # OACIQ guardrails
│   │   ├── dr-brain/         # Admin intelligence
│   │   ├── growth/           # Growth & marketing
│   │   └── design-system/    # UI tokens & components
│   ├── config/               # Hub registry, routes, feature flags
│   └── lib/                  # Core library code
├── prisma/
│   ├── schema.prisma         # Single Prisma schema (~746 models)
│   ├── migrations/           # Database migrations
│   └── seeds/                # Seed data scripts
└── services/                 # Internal service layer
```

## Module List

| # | Module | Description | Status |
|---|---|---|---|
| 1 | Core | Auth, users, roles, platform shell | Active |
| 2 | Homes | Buy/sell/rent real estate marketplace | Active |
| 3 | BNHub | Short-term stays (Airbnb-like) | Active |
| 4 | Invest | ROI tools, portfolio, deal analysis | Beta |
| 5 | Forms | Legal forms, e-signatures, OACIQ docs | Beta |
| 6 | ImmoContact | Chat, AI assistant, lead routing | Active |
| 7 | Compliance | OACIQ guardrails, audit trail | Active |
| 8 | DrBrain | Admin intelligence, monitoring | Internal |
| 9 | Admin | Admin dashboard, controls | Active |
| 10 | Growth | Marketing, email capture, tracking | Active |
| 11 | Design System | Tokens, components, shells | Internal |

## Data Flow

```
Browser
  │
  ▼
Next.js App Router (apps/web/app/)
  │
  ├── Server Components ──► Prisma Client ──► PostgreSQL
  │
  ├── API Routes (app/api/) ──► Prisma Client ──► PostgreSQL
  │
  └── Client Components ──► fetch(/api/...) ──► API Routes
```

All database access goes through a single Prisma client instance (`lib/db/prisma.ts`).

## Build Flow

```
pnpm install
  │
  ▼
postinstall: prisma generate (with placeholder DATABASE_URL in CI)
  │
  ▼
next build --webpack (NODE_OPTIONS=--max-old-space-size=16384)
  │
  ▼
Vercel deployment
```

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| `force-dynamic` rendering on most pages | Avoids build-time DB queries; all data fetched at request time |
| No static generation (SSG) | Database-driven content; static pages would be stale immediately |
| Single Prisma entry point | `lib/db/prisma.ts` — prevents multiple PrismaClient instances in dev |
| Placeholder DATABASE_URL at build time | Allows `prisma generate` during CI without a real database connection |
| Runtime guard for placeholder URL | `lib/db/prisma.ts` throws if placeholder reaches production runtime |
| `--webpack` flag on dev/build | Explicit webpack bundler selection for Next.js 16 |
| Monorepo with pnpm workspaces | Shared packages across apps/services while maintaining isolation |
