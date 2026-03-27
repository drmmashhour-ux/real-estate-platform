# Master AI system — implementation report

**Scope:** Leads + marketing + intelligence (rule-based, explainable; no fake ML predictions).

## ✅ AI features implemented

| Area | What ships | Where |
|------|------------|--------|
| **Lead scoring** | 0–100 score; tiers 80+ hot / 50–79 warm / &lt;50 cold; form + behavior merge | `lib/ai/lead-scoring.ts`, `lead-tier.ts`, `behavior-scoring.ts`, `merge-lead-display.ts` |
| **Activity tracking** | `search`, `listing_view`, `listing_save`, `message_sent`, duration, repeat days | `AiUserActivityLog`, `POST /api/ai/activity` |
| **Broker AI dashboard** | Hot leads, recent activity, suggested actions | `GET /api/broker/ai/leads-dashboard`, UI `/dashboard/broker/ai-leads` |
| **Marketing engine** | Templates + stub listing copy; persisted content model | `lib/ai/marketing-engine.ts`, `AiMarketingContent`, `POST /api/ai/marketing/generate` |
| **Recommendations** | “For you” from views + inventory; history log | `lib/ai/user-property-recommendations.ts`, `GET /api/ai/recommendations/for-you`, `RecommendedForYou` |
| **Smart search (intent)** | NL → filter hints; **sale** vs **nightly_stay** contexts | `lib/ai/search-intent.ts`, `POST /api/ai/search/intent` (`context`) |
| **Search autocomplete** | Public phrase suggestions (no PII) | `lib/ai/search-autocomplete.ts`, `GET /api/ai/search/suggest` |
| **Stays UI** | Smart search row + autocomplete + “Apply AI to filters” + search activity log | `app/bnhub/stays/stays-search-client.tsx` |
| **Listing view logging** | `listing_view` + dwell via `session_heartbeat` (no double-count) | `components/ai/LogListingView.tsx`, `app/bnhub/[id]/page.tsx` |
| **Preference hints** | Locations + nightly price band from views | `lib/ai/user-preference-hints.ts`, bundled in `GET /api/ai/recommendations/for-you` |
| **Broker market UI** | Hot zones + trending areas | `/dashboard/broker/market-insights`, hub nav **Market AI** |
| **Pricing assistant** | Suggested range from peer / market stats | `lib/ai/pricing-assistant.ts`, `GET /api/ai/pricing/suggest` |
| **Market analytics** | Hot zones, trending areas (aggregates) | `lib/ai/market-analytics.ts`, `GET /api/ai/market/summary` |
| **Fraud heuristics** | User/listing risk flags (rules) | `lib/ai/fraud-heuristics.ts`, `POST /api/admin/ai/fraud-heuristic` |
| **Automation hooks** | Events recorded (hot lead, price-drop intent) | `lib/ai/automation-triggers.ts`, `AiAutomationEvent` |

## 📊 Lead system status

- **DB:** `Lead` (score + optional `aiExplanation`), `UserAiProfile` (aggregated behavior score), `AiUserActivityLog`.
- **Updates:** Activity POST refreshes profile; lead POST can merge behavior when `userId` is linked.
- **Privacy:** Leads **GET** is authenticated; brokers see scoped leads only (not public dumps).

## 📢 Marketing system status

- Content generation is **template / stub** based — suitable for product copy and campaigns; upgrade path: plug LLM behind same interfaces with audit logs.

## 🧠 Recommendation performance

- Deterministic ranking from recent views and published listings; logged in `AiRecommendationHistory` for future evaluation — not claimed as ML accuracy.

## ⚠️ Limitations

1. **No ML models** — all logic is transparent rules; scores are heuristics.
2. **Automation** — `AiAutomationEvent` records intents; wire to your email/push workers separately.
3. **Client instrumentation** — ensure listing pages and search call `POST /api/ai/activity` for full signal.
4. **Run migrations** — apply `prisma migrate deploy` (or dev `db push`) in each environment.

## 🧪 Tests

- `lib/ai/lead-tier.test.ts` — tier boundaries and broker copy.
- `lib/ai/search-intent.test.ts` — sale + nightly intent parsing.
- `lib/ai/search-autocomplete.test.ts` — suggestion lists.
- `lib/ai/marketing-engine.test.ts` — templates + listing stub (no DB).

Run: `cd apps/web && npm test`

## 🎯 Next steps (investor-grade)

- A/B test tier thresholds; export `AiRecommendationHistory` for offline metrics.
- Add job consumer for `AiAutomationEvent` → Resend / FCM / in-app.
- Optional: embeddings for “similar listings” behind same API shape.
