# Collaboration layer (ImmoContact adjacent)

Lightweight **team collaboration** helpers: generate **Zoom** (primary) and **Microsoft Teams** (optional enterprise) meeting links, store session metadata, and attach **simple internal notes** to listings, leads, or broker context.

## What is supported

| Capability | Detail |
| --- | --- |
| Meeting links | **Mock / env-configured** URLs — structured for future Zoom / Graph API integration |
| Session log | Append-only JSON store (`data/collaboration-sessions.json`) |
| Notes | Per-entity notes (`data/collaboration-notes.json`) |
| UI | **Start call** (Zoom), **Schedule meeting** (Teams-style link), contextual titles |
| Access | **Broker** and **admin** only (API-enforced) |

## Zoom vs Teams (intended usage)

- **Zoom** — default for **Start call** — `mode=now` in stored session metadata; base URL from `COLLABORATION_ZOOM_MEETING_BASE` or `NEXT_PUBLIC_COLLABORATION_ZOOM_MEETING_BASE`.
- **Teams** — **Schedule meeting** flow — `mode=schedule` by default; base from `COLLABORATION_TEAMS_MEETING_BASE` or `NEXT_PUBLIC_COLLABORATION_TEAMS_MEETING_BASE`.

Both append query parameters: `collab_session`, `entity`, `mode`, `provider` for traceability.

## What is explicitly *not* in scope

- **No** full chat or Teams-like product.
- **No** in-app video infrastructure; users open the **external** provider in a new tab.
- **No recording** — no platform recording integration in this layer; any recording is a **manual** provider feature and a **separate** product decision later.
- **No auto-calling** or background dialling — every action is **user-initiated** in the browser.
- **No** automatic meeting starts or cron/queue execution.

## Example flows

1. **Listing (broker viewing public page)** — “Discuss this property” → Start call → API creates session → link opens in new tab → session stored.
2. **Lead** — “Call this lead” → same; notes added in the panel stay on `entity=lead:<id>`.
3. **Broker hub** — “Start broker call” → `entity=broker:<brokerUserId>` for internal team sync.

## Environment overrides

| Variable | Purpose |
| --- | --- |
| `COLLABORATION_SESSIONS_JSON_PATH` | Override session JSON path |
| `COLLABORATION_NOTES_JSON_PATH` | Override notes JSON path |
| `COLLABORATION_ZOOM_MEETING_BASE` | Zoom join / start URL stub |
| `COLLABORATION_TEAMS_MEETING_BASE` | Teams meetup URL stub |

## Monitoring

Console prefix: **`[collaboration]`** — tracks meetings created and notes added (`collaboration-monitoring.service.ts`).
