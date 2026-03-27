# Fully Autonomous AI Marketplace Operator (BNHub)

The AI Operator is a production-oriented intelligence and automation layer on top of the BNHub short-term rental marketplace. It **does not replace** core backend logic; it monitors, analyzes, recommends, and automates selected operations while requiring human override for sensitive actions.

## Architecture

- **Service:** `services/ai-operator` – Express app with agents, decision logging, alerts, jobs, and human-override support.
- **Integration:** Web-app persists operator decisions and alerts to Prisma when `AI_OPERATOR_URL` is set and proxies requests to the operator.

## Service structure

| Folder       | Purpose |
|-------------|---------|
| agents/     | 8 specialized agents (listing moderation, pricing, fraud, booking integrity, demand, host performance, support triage, marketplace health) |
| controllers/| HTTP handlers for each endpoint |
| services/   | operator-service (orchestration, logging, alerts), decision-store, alert-store |
| models/     | Types for decisions, alerts, agent I/O |
| policies/   | Automation boundaries (what may be automated vs human-required) |
| routes      | Express router at `/api/ai-operator` |
| jobs/       | Daily listing scan, pricing refresh, fraud scan, demand update, host performance, support triage, marketplace health |
| prompts/    | Prompt templates for future LLM use |
| tests/      | Unit tests for agents, policies, override |

## Agents

| Agent | Responsibility | Endpoint |
|-------|----------------|----------|
| Listing Moderation | Listing quality, policy compliance, trust flags | POST /api/ai-operator/listings/analyze |
| Pricing | Recommended nightly price, range, demand label, min stay | POST /api/ai-operator/pricing/recommend |
| Fraud Risk | Fraud score, risk level, auto-flag | POST /api/ai-operator/fraud/evaluate |
| Booking Integrity | Booking integrity score, anomaly status, hold/approve/review | POST /api/ai-operator/bookings/check |
| Demand Forecast | High/low demand periods, supply shortage, pricing pressure | POST /api/ai-operator/demand/forecast |
| Host Performance | Host quality score, strengths/weaknesses, badge eligibility | POST /api/ai-operator/hosts/analyze |
| Support Triage | Category, urgency, suggested reply, escalation | POST /api/ai-operator/support/triage |
| Marketplace Health | Health score, anomaly alerts, operational recommendations | POST /api/ai-operator/marketplace/health |

Each agent returns: **confidence score**, **recommended action**, **reason codes**, and **escalate to human** when appropriate.

## API endpoints (operator service)

**POST** (agent triggers)

- `/api/ai-operator/listings/analyze`
- `/api/ai-operator/pricing/recommend`
- `/api/ai-operator/fraud/evaluate`
- `/api/ai-operator/bookings/check`
- `/api/ai-operator/demand/forecast`
- `/api/ai-operator/hosts/analyze`
- `/api/ai-operator/support/triage`
- `/api/ai-operator/marketplace/health`

**GET**

- `/api/ai-operator/alerts` – list alerts (query: alertType, severity, status, limit, offset)
- `/api/ai-operator/decisions` – list decisions (query: agentType, entityType, entityId, limit, offset)
- `/api/ai-operator/pricing/:listingId` – last pricing recommendation for listing
- `/api/ai-operator/hosts/:hostId` – last host analysis for host
- `/api/ai-operator/forecast/:market` – last demand forecast for market

**Human override**

- `POST /api/ai-operator/decisions/:id/override` – body: `{ overrideBy, newAction, notes? }`

## Automation rules

**May automate (low risk):** flag listing/booking for review, create alert, suggest price update, route support ticket, add to moderation queue, recommend host improvement, set demand forecast.

**Must require human:** ban account, seize funds, finalize legal, remove listing permanently, approve high-risk payout, reject listing, cancel booking, refund payment, suspend host/guest.

See `policies/automation-boundaries.ts`.

## Decision logging and explainability

Every agent run produces a **decision log** entry:

- agentType, entityType, entityId
- inputSummary, outputSummary
- confidenceScore, recommendedAction, reasonCodes
- automatedAction (if any)
- humanOverride (if any)
- createdAt

The web-app stores these in **AiOperatorDecision** (Prisma) when calling the operator. Alerts are stored in **AiOperatorAlert**.

## Scheduled jobs

| Job | Default schedule | Description |
|-----|------------------|-------------|
| daily-listing-scan | 6 AM | Fetch new listings, run listing moderation |
| pricing-refresh | 7 AM | Generate pricing recommendations for listings |
| fraud-scan | Hourly | Evaluate recent bookings for fraud risk |
| demand-forecast-update | 8 AM | Update demand forecast per market |
| host-performance-update | 9 AM | Analyze host performance |
| support-triage-refresh | Every 30 min | Triage open support tickets |
| marketplace-health-check | Every 6 h | Run marketplace health agent |

Set `RUN_JOBS=true` to start the cron scheduler. Run once: `npm run jobs:ai-operator`.

## Web-app integration

- **Env:** `AI_OPERATOR_URL` (e.g. `http://localhost:4003`) to proxy and persist.
- **Routes:** `/api/ai-operator/listings/analyze`, `/api/ai-operator/pricing/recommend`, `/api/ai-operator/fraud/evaluate`, plus GET `/api/ai-operator/decisions`, `/api/ai-operator/alerts`, and POST `/api/ai-operator/decisions/[id]/override`.
- **Prisma:** `AiOperatorDecision`, `AiOperatorAlert`.
- **Admin:** **AI Operator Dashboard** (`/admin/ai-operator`) – alerts queue, decision log, override info. Linked from AI Control Center.

## Security and governance

- No direct destructive action without authorization; policies enforce human-required actions.
- All overrides are logged (overrideBy, newAction, notes).
- Operator endpoints should be protected (e.g. admin-only or service-to-service auth).
- Data: operator receives only payloads needed for analysis; web-app enforces auth and scoping.

## Running

- Start operator: `npm run dev:ai-operator` (port 4003).
- Run tests: `npm run test:ai-operator`.
- Run jobs once: `npm run jobs:ai-operator`.
- Set `AI_OPERATOR_URL` in web-app and run operator for full flow; web-app then persists decisions and alerts to the database.
