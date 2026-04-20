# Investor share link (read-only)

## Security contract (implementation reminder)

**Do not**

- Expose admin-only data, raw internal notes, or identifiers (UUIDs/CUIDs, Stripe-like ids, emails).
- Allow edits, execution actions, or hidden query paths to broader internal data from the shared route.
- Weaken revocation or expiry: inactive links must behave like unknown tokens with a **generic** message.

**Do**

- Filter aggressively in `filterInvestorDashboardForShare` / `scrubInvestorShareText` before any public render.
- Keep the public view polished and disclaimers clear.
- Keep uncertainty honest (confidence tiers, missing-data warnings in investor-safe language).
- Keep links revocable (explicit `revoked` status) and auditable (`[investor-share]` logs, view counts on valid opens).

## What it is

A **secure, revocable URL** (`/investor/share/[token]`) that shows a **filtered snapshot** of the auto-generated investor dashboard. It is **view-only**: no admin UI, no edits, no execution actions, no hidden APIs to broader internal data. The rendered payload **does not include internal share/database IDs**; text is scrubbed for UUID-like and CUID-like identifiers before display.

Enable with environment flags (`default off`):

- `FEATURE_INVESTOR_SHARE_LINK_V1` — backend create/list/revoke (`/api/investors/share`).
- `FEATURE_INVESTOR_SHARE_PANEL_V1` — internal panel on Growth Machine (next to the investor dashboard) when paired with `FEATURE_INVESTOR_DASHBOARD_*`.
- `FEATURE_INVESTOR_SHARE_PUBLIC_V1` — public page route.

## What data can be shared

Operators choose **visibility toggles** per link:

| Toggle | Content |
|--------|---------|
| Metrics | Aggregated headline metrics + confidence tiers |
| Narrative | Headline, summary, growth narrative lines |
| Proof points | Former “execution proof” lines (sanitized wording) |
| Expansion | Expansion strategy lines |
| Risks | Risk bullets + curated meta warnings |
| Outlook | Forward-looking framing (advisory, not guarantees) |

Optional **label** (internal only), **public title/subtitle** (shown on the page), **rolling window days** (7–45), and **optional expiry**.

## How filtering works

Internal dashboard payloads from `buildInvestorDashboard()` pass through **`filterInvestorDashboardForShare()`** before any public render:

- Drops lines matching internal/product-debug patterns (e.g. Growth Machine internals, operator telemetry phrasing, admin tooling references).
- Rewrites a few product labels to neutral investor language where needed (e.g. “Fast Deal” → “Market bundle”).
- Omits internal-only warning strings; keeps **honest uncertainty** (missing data, sparse signals) in investor-safe wording.
- Never attaches raw CRM rows, lead IDs, broker-private fields, or execution planner assignments.

The public route **never** returns the raw internal dashboard JSON.

## Expiry

If **`expiresAt`** is set and the current time is past it:

- The link is treated as **inactive** (same outcome as unknown token).
- Stored status may be normalized to **`expired`** when read from the in-memory store.

Same generic message as invalid/revoked tokens — **no enumeration** of other shares.

## Revocation

**Revoke** sets status to **`revoked`**. Subsequent loads behave like an unknown token (generic unavailable message). Monitoring logs `[investor-share] revoked`.

## Persistence (V1)

Share metadata is kept **in-process** (same pattern as other lightweight internal stores). Restart clears links — generate new links after deploy if needed. Production hardening may move this to DB later without changing the public filtering contract.

## Safe use with investors

- Preview toggles — disable sections you do not want outsiders to see.
- Prefer **short expiries** for sensitive periods.
- **Revoke** after meetings or if a link leaks.
- Treat all figures as **directional** and consistent with the disclaimer on the page.

## Monitoring

Structured console logs use prefix **`[investor-share]`** (`created`, `revoked`, `view`, `invalid-token`). Logging never throws.
