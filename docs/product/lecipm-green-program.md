# LECIPM Green Score & Optimization Program

**Positioning:** *LECIPM helps you transform properties into high-value, green-certified assets (internal methodology).*

## Product definition

The **LECIPM Green Program** helps owners and brokers:

- Evaluate an **internal** ESG-style score for a property (modeled inputs).
- Follow **step-by-step upgrade guidance** (envelope → mechanicals → renewables).
- Earn **“LECIPM Green Certified (internal score)”** — platform badge only when eligibility rules pass.
- Unlock **browse priority** on FSBO marketplace surfaces when premium + certified.
- Drive **new revenue** via the **Green Upgrade Program** (premium tier).

## Compliance (critical)

- **Do not** claim official certification from **Rénoclimat**, municipal rules (e.g. green roofs), EnerGuide labels, or other government programs unless the user uploads **verifiable third-party documents** and ops explicitly confirms.
- Always position as **“LECIPM Green Score & Optimization Program”** and label badges **“LECIPM Green Certified (internal score)”**.
- Optional **document upload** slots may store references to **real** external programs for staff review — never auto-map to government certification in UI.

## Modules

Implementation lives under `apps/web/modules/green/`:

| File | Purpose |
|------|---------|
| `green.types.ts` | Tiers, improvement rows, metadata, `parseGreenProgramTier`. |
| `green.engine.ts` | Score 0–100 + improvements + projected score after selections. |
| `green-upgrade.advisor.ts` | Ordered retrofit narrative. |
| `green.certification.service.ts` | Premium-only automated certification gate. |
| `green.priority-ranking.ts` | Browse `sortAt` multiplier for priority placement. |
| `green-logger.ts` | `[green-system]`, `[esg-upgrade]`, `[certification]` logs. |

## APIs

- `POST /api/green/analyze` — model score & advisor steps (no DB write).
- `PATCH /api/green/fsbo/[id]` — owner persists modeled score, tier, optional metadata; certification timestamp when eligible.

## Database

`FsboListing` columns (see Prisma):

- `lecipmGreenInternalScore`
- `lecipmGreenCertifiedAt`
- `lecipmGreenProgramTier` (`none` | `free` | `premium`)
- `lecipmGreenMetadataJson`

## Monetization

| Tier | Includes |
|------|-----------|
| **Basic / none** | Free suggestions (`POST /analyze`), educational positioning. |
| **Premium** | Full staged plan, certification badge (internal), marketplace priority boost. |

Stripe product wiring is separate — UI references indicative pricing only until billing is connected.

## Investor narrative

ESG-aligned residential assets increasingly compete for capital and buyer attention. Internal scoring and transparent upgrade paths improve **perceived diligence** and **long-term positioning** — always framed as modeled insight, not a regulated disclosure.

## Acceptance checklist

- [ ] Analyze endpoint returns deterministic score + improvements.
- [ ] PATCH persists tier/score and sets certification when premium + threshold.
- [ ] Buyer browse applies green priority multiplier before trust multiplier + sort.
- [ ] Listing cards show **🌱 Green Priority Listing** when premium + certified.
- [ ] Broker dashboard shows Green Optimization section + monetization tiers.
