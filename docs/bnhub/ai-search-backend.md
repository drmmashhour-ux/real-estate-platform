# AI search & ranking (backend-first)

## Principles

- **Parsing and ranking live on the platform** (`apps/web`). The mobile app sends a natural-language `query` and renders JSON results.
- The first-pass parser is **rule-based** (`lib/search/natural-language-parse.ts`). An LLM or embeddings layer can replace or augment the same `ParsedNaturalQuery` shape later.
- Rank scores are **deterministic** and return human-readable **reason tags** (`lib/search/rank-listings.ts`).

## API

- `POST /api/search/ai` — body `{ "query": "…" }`. Returns `{ parsed, listings[] }` with `score`, `reasons`, and optional `latitude` / `longitude` per listing for future map pins.

## Backend modules

| Concern | Location |
|--------|-----------|
| NL → filters | `apps/web/lib/search/natural-language-parse.ts` |
| Ranking | `apps/web/lib/search/rank-listings.ts` |
| Orchestration | `apps/web/lib/search/run-ai-search.ts` |

## Mobile

- `apps/mobile/src/app/search.tsx` calls the API with `fetch` (no secrets). Listing cards optionally show rank labels and reason tags; property detail can receive `rankTags` via route params when opened from search.
