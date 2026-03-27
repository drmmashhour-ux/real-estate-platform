# LECIPM Simplified Architecture Diagram

High-level flow from users down to infrastructure. Use this for onboarding and high-level design discussions.

---

## Diagram (Markdown)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS                                           │
│  Guests · Hosts · Brokers · Owners · Investors · Support · Admins             │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATIONS                                         │
│  Web App (Next.js) · Admin Dashboard · Broker Dashboard · Owner Dashboard     │
│  Mobile (iOS/Android/Web) · BNHub Host/Guest UI                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PLATFORM SERVICES                                      │
│  Auth · Users · Listings · Search · Bookings · Payments · Messaging          │
│  Reviews · Trust & Safety · Disputes · Subscriptions · Promotions · Analytics │
│  Supply Growth · Referrals · BNHub · Broker CRM · Deal Marketplace           │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APIs                                             │
│  REST / API Routes (Next.js) · Internal service APIs · Webhooks               │
│  /api/bnhub/* · /api/admin/* · /api/defense/* · /api/ai/*                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│     DATA LAYER         │ │    AI SYSTEMS          │ │ GOVERNANCE & DEFENSE   │
│  PostgreSQL (Prisma)  │ │  Pricing · Fraud        │ │  Policy engine         │
│  User · Listing       │ │  Moderation · Support   │ │  Operational controls  │
│  Booking · Payment     │ │  Recommendations       │ │  Platform Defense      │
│  Message · Review      │ │  Demand · Ranking      │ │  Legal · Evidence      │
│  Dispute · Enforcement │ │  AI Control Center     │ │  Abuse · Compliance    │
│  Evidence · Compliance │ │  Human-in-the-loop     │ │  Crisis · Enforcement  │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE                                         │
│  Docker · Postgres · Object storage · Secrets · CI/CD · Deployment            │
│  Monitoring · Logging · Alerts                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow summary

| Layer | Description |
|-------|-------------|
| **Users** | All actor types that interact with the platform. |
| **Applications** | Web, admin, broker, owner, mobile; BNHub is part of web app. |
| **Platform services** | Domain capabilities (auth, listings, bookings, etc.) implemented in `apps/web` and/or `services/*`. |
| **APIs** | Entry points for apps and internal callers; Next.js API routes and optional microservice endpoints. |
| **Data layer** | Single primary database (Prisma schema in web-app); models for users, listings, bookings, payments, defense, compliance, etc. |
| **AI systems** | AI/ML features (pricing, fraud, moderation, support, ranking) and AI Control Center for governance. |
| **Governance & defense** | Policy engine, operational controls, Platform Defense (legal, evidence, abuse, internal access, crisis, compliance, financial, enforcement). |
| **Infrastructure** | Run-time and deployment: DB, storage, containers, CI/CD, observability. |

---

## Key integration points

- **Applications** call **APIs**; APIs use **platform services** and **data layer**.
- **AI systems** read from data and services; outcomes feed **policy engine** and **trust & safety**.
- **Governance & defense**:
  - Policy engine and operational controls affect **bookings**, **listings**, **payouts**.
  - Defense layer uses **auth**, **users**, **bookings**, **payments**, **disputes**, **admin** and writes legal events, evidence, abuse, enforcement, compliance, crisis logs.

This diagram is intentionally simplified; see [Master Index](master-index.md) and [Modules Registry](MODULES-REGISTRY.md) for detailed docs.
