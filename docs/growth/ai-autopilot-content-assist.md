# AI Autopilot — Content draft assist (Growth)

## Purpose

Provide **deterministic, template-based drafts** for **ad copy**, **listing copy**, and **outreach copy** on the Growth machine dashboard. Everything is **draft-only**: operators copy, edit, and publish through their normal tools.

## Draft types

| Type            | Use case              | Sub-flag                                  |
|-----------------|-----------------------|-------------------------------------------|
| `ad_copy`       | Short ads / hooks     | `FEATURE_AI_AUTOPILOT_AD_COPY_V1`         |
| `listing_copy`  | Titles + descriptions | `FEATURE_AI_AUTOPILOT_LISTING_COPY_V1`    |
| `outreach_copy` | Manual outreach text  | `FEATURE_AI_AUTOPILOT_OUTREACH_COPY_V1`   |

Master gate: **`FEATURE_AI_AUTOPILOT_CONTENT_ASSIST_V1`** must be on for any drafts to appear.

## Tone system

Drafts use `tone`: **friendly**, **professional**, or **high-conversion**, and `variant`: **short**, **standard**, or **long**. Copy avoids guaranteed outcomes and high-pressure language.

## What it does NOT do

- Does **not** auto-publish listings, ads, or messages.
- Does **not** call Meta, TikTok, Google Ads, or other ad APIs.
- Does **not** overwrite live listing data in the database.
- Does **not** send email/SMS/chat automatically.

## Usage (dashboard)

1. Enable `FEATURE_AI_AUTOPILOT_CONTENT_ASSIST_V1` and the sub-flags you need.
2. Open **Dashboard → Growth machine** (`FEATURE_GROWTH_MACHINE_V1`).
3. Use **Content Studio — draft assist**: copy text with **Copy**, refresh wording with **Regenerate variants** (deterministic alternates).

## Telemetry

Server logs and counters use the `[autopilot:content]` tag for copy/regenerate events (authenticated dashboard requests only).

## Validation

```bash
cd apps/web && pnpm exec vitest run modules/growth/__tests__/ai-autopilot-content-assist.test.ts
```

---

**Human-controlled:** drafts are suggestions; publishing and spend stay outside this module.
