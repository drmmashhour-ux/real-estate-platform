# Soins Hub — AI health / event monitoring layer

## Purpose & scope

This layer turns **resident operational events** (workflows, sensors, chats, family inputs) into:

- deterministic **risk tiers** for routing,
- **plain-language summaries** for staff/family dashboards,
- **explainable rule traces** (no black-box scoring),
- **permission-aware notification plans**.

It is **not** a medical device and **does not diagnose disease**, prescribe treatment, or replace clinicians.

Allowed outputs describe **operational** situations only, for example:

- “Operational follow-up advised”
- “Support attention needed”
- “Check-in recommended”
- “Equipment / workflow verification suggested”

Forbidden outputs include diagnostic claims (“has pneumonia”), treatment plans, or certainty about medical conditions.

## Modules (`apps/web/modules/soins-ai/`)

| File | Responsibility |
|------|----------------|
| `soins-ai.types.ts` | Signal enums, risk levels, assessments, routing plans, dashboard VMs |
| `soins-ai-risk.service.ts` | Deterministic rule engine (`evaluateSoinsRisk`) |
| `soins-ai-summary.service.ts` | Daily summaries, admin pulse, signal extraction from `CareEvent` rows |
| `soins-ai-notification.service.ts` | Permission-aware routing (`planSoinsAiNotifications`) |
| `soins-ai-explainability.service.ts` | Human-readable rule explanations |

## Signal types (`SoinsSignalType`)

Operational buckets (aggregated from events + infrastructure flags):

| Signal | Meaning (operational) |
|--------|------------------------|
| `MOVEMENT_MISSED` | Movement workflow did not complete as scheduled |
| `MISSED_MEAL` | Meal workflow signal |
| `MISSED_MEDICATION` | Medication workflow signal |
| `ABNORMAL_ACTIVITY` | Activity pattern flagged for review (not a diagnosis) |
| `EMERGENCY_BUTTON` | Emergency-call / equivalent protocol signal |
| `CHAT_DISTRESS_SIGNAL` | Chat content flagged by keyword rules for staff review |
| `CAMERA_INACTIVITY` | Camera/stream infrastructure inactive |
| `FAMILY_CONCERN` | Family-initiated operational concern logged |

## Risk logic (deterministic)

Implemented in `evaluateSoinsRisk`:

- **CRITICAL**: `EMERGENCY_BUTTON` ≥ 1  
- **HIGH**: `MISSED_MEDICATION` and `MISSED_MEAL` together; OR `ABNORMAL_ACTIVITY` + camera infra inactive; OR repeated low-like operational signals ≥ 6 in window  
- **MEDIUM**: repeated low-like operational signals ≥ 3; OR elevated family concern  
- **LOW**: otherwise; optional family standard concern lines still logged without raising tier unless rules say so  

“Low-like” aggregates movement/meal/camera/chat distress buckets — **workflow noise**, not vitals interpretation.

## Summaries

- **`buildResidentDailySummary`**: rolling 24h operational snapshot — meals workflow text, movement signals, alert counts, chat snippet, camera channel counts, recommended follow-up from assessment actions.  
- **`buildFamilyFriendlySummary`**: shorter greeting + plain wording wrapper.  
- **`buildAdminSoinsSummary`**: residence-wide pulse — counts of EMERGENCY / HIGH severity events, resident census, recent operational notes.

Summaries stay deterministic given the same stored events.

## Notification rules (`planSoinsAiNotifications`)

- Family **must** have `FamilyAccess.canReceiveAlerts` to appear in `familyNotifyUserIds`.  
- Messages that specifically reference **camera/stream infrastructure** should use `familyCameraNotifyUserIds` (requires both alerts + camera permission).  
- Staff routing target is `CareResidence.operatorId` when present (operational inbox).  
- Admin broadcast recommended for **HIGH**/**CRITICAL** assessments (ties into existing platform notification gates).

Suppressed audiences are recorded with reasons (e.g. no eligible family recipients).

## Privacy expectations

- Explainability entries describe **rules**, not resident diagnoses.  
- Chat snippets in summaries are truncated operational excerpts — avoid copying sensitive clinical notes from unstructured fields if you extend ingestion.  
- Align retention and access with your privacy policy and residence agreements.

## Testing

See `apps/web/modules/soins-ai/__tests__/` for Vitest coverage of risk rules and deterministic summaries.
