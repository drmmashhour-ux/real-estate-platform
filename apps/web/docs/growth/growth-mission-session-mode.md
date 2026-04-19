# Growth Mission Control — session mode

**Feature flags (default off):**

- `FEATURE_GROWTH_MISSION_SESSION_V1` — builds session steps.
- `FEATURE_GROWTH_MISSION_SESSION_PANEL_V1` — shows the session UI on Mission Control.

## What it is

Session mode turns the Mission Control **summary + action bundle** into a **short, ordered checklist** with local progress (browser `localStorage`). It is **execution-guided**, not autopilot.

## What it is not

- Does not apply policy, send messages, or mutate CRM/growth engines.
- Does not replace Mission Control’s advisory summary — it **layers a focused pass** on top.

## Difference vs summary view

| Summary view | Session mode |
|--------------|--------------|
| Read posture, risks, and links at once | Same data, **one “Now” step** + explicit **Mark done / Skip** |
| No durable progress | **Lightweight progress** in-browser only |
| Action bridge links | Same links, framed as **session steps** |

## Operator flow

1. Open Mission Control with session flags enabled.
2. Click **Start session** — deterministic steps are generated (bounded count).
3. Use **Open panel** for navigation steps (safe query params); use **Mark done** when work is addressed.
4. **End session** clears storage on complete; **Abandon** keeps a terminal record until replaced.

## Monitoring

Prefix: `[growth:mission-session]` — see `growth-mission-session-monitoring.service.ts`.
