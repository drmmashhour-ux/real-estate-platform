# Dream Home AI

**Purpose** — Guided, transparent home search: collect **explicit** lifestyle and household needs, build a **structured** dream-home profile, turn it into **search filters + ranking weights**, match public FSBO listings, and log decisions into the **Playbook Memory** engine (domain `DREAM_HOME`) for future learning. No automated broker contact, no financial or legal actions.

## Safety rules

- Personalization uses **only declared** questionnaire fields. **No** inference from nationality, ethnicity, religion, or other protected characteristics; **no** stereotypes.
- **No** outbound messaging, email, or broker automation from this flow. Execution is **recommend / rank** only, aligned with the Dream Home execution adapter allow-list.
- Explanations are **deterministic and inspectable** (rationale, score breakdown, tradeoffs). Optional LLM text is still validated to the same JSON shape and can fall back to the deterministic path.

## Questionnaire fields (high level)

See `types/dream-home.types.ts` (`DreamHomeQuestionnaireInput`) for the full list: household size, adult/child counts, elders, guest frequency, work-from-home level, budget min/max, transaction type, city / neighborhoods / radius, commute & noise priorities, privacy & hosting, kitchen & outdoor, pets, accessibility list, style & special space tags, must-haves, deal-breakers, lifestyle tags.

## Profile output

`DreamHomeProfile` includes: optional **summary**, **household** narrative, **property** / **neighborhood** trait bullets, **searchFilters** (including `minBedrooms` / `minBathrooms` and legacy `bedroomsMin` / `bathroomsMin`), **rankingPreferences** (weights), **rationale**, **tradeoffs**, and **warnings**.

## Ranking

- `utils/dream-home-scoring.ts` — keyword + bedroom/budget **filter fit** and text-based **lifestyle** fit, blended by **ranking preferences**.
- `services/dream-home-ranking.service.ts` — re-ranks candidates, optionally nudged by the **top eligible** `DREAM_HOME` playbook (bandit / recommendation service). Logs `dream_home_rank_listings` and, when used, `dream_home_recommend_playbook`.

## Playbook / memory

- `dream_home_generate_profile` — logged on successful profile build (playbook write service, non-blocking).
- `dream_home_generate_filters` — match path after filters applied.
- `dream_home_rank_listings` / `dream_home_recommend_playbook` — see ranking service and `/api/dream-home/playbooks`.

## APIs

- `POST /api/dream-home/profile` — questionnaire (or legacy intake) → `DreamHomeProfile`
- `POST /api/dream-home/match` — optional `profile`, else builds profile from body; returns listings + tradeoffs
- `POST /api/dream-home/rank` — `profile` (or build from body) + `listings[]` → ranked list + rationale
- `GET/POST /api/dream-home/session` — best-effort wizard state cookie
- `GET/POST /api/dream-home/playbooks` — recommendations; `POST` with `{ mode: "assign" }` for a safe bandit **suggestion** (no auto-execution)

## Future outcome signals (planned)

Wire product events (no protected traits) into **Playbook memory** outcomes, e.g. `listingSave`, `detailViewDepth`, `shortlistAdd`, `inquirySubmit`, `bookedVisit`, to feed the Dream Home reward model (`computeDreamHomeReward` in `playbook-domains/dream-home/dream-home-kpi-signals.ts`).

## Tests

`modules/dream-home/tests/` — normalisation, scoring, prompts, profile, match, ranking.

```bash
pnpm vitest run modules/dream-home/tests/
```
