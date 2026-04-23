# Demo HTTP flow (Carrefour)

0. Set **`JWT_SECRET`** in `.env` (required for login / `demo:flow`).

1. `npx prisma db seed` — optional; creates seller & buyer with demo password (see `docs/FULL_PRODUCTION_BUILD.md`)
2. `POST /api/property` — create property (`ownerId` = seed seller)
3. `GET /api/property` — list properties
4. `POST /api/message` — send message
5. `POST /api/offer` — create offer
6. `POST /api/chat` — AI reply (needs `OPENAI_API_KEY`)
7. `POST /api/contract` — persist contract row (for signature FK)
8. `lib/contracts.ts` — `generateContract()` for PDF bytes (call from server code)
9. `POST /api/sign` — sign contract
10. `POST /api/deal/close` — `{ "offerId" }` → `closeDeal()` / `ACCEPTED`

**Script:** from `carrefour-immobilier/`:

```bash
# Terminal 1 — Postgres running; DATABASE_URL in .env
npx prisma migrate dev
npx prisma db seed
PORT=3001 npm run dev

# Terminal 2
BASE_URL=http://localhost:3001 npm run demo:flow
```

Default `BASE_URL` is `http://localhost:3001` so it doesn’t clash with `apps/web-app` on `:3000`.
