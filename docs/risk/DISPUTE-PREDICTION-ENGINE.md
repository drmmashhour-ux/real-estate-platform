# Dispute Prediction Engine

Operational **friction forecasting** for LECIPM / BNHub — **not** legal fault assignment.

## Goals

- Combine live signals (bookings, deals, compliance touches, autopilot friction) with **lightweight learned clusters** mined from historical dispute openings.
- Emit a **disputeRiskScore** (0–100), **risk band**, and **predictedCategory** label for UX, prevention, and measurement.
- Persist **snapshots** for audit and for comparison when a dispute is later opened.

## Components

| Module | Role |
|--------|------|
| `dispute-prediction.engine.ts` | `buildDisputePredictionContext`, `runDisputePrediction`, `inferPredictedCategory`, snapshot persistence |
| `dispute-pattern-learning.service.ts` | Periodic correlation of dispute cases vs prior risk assessments → `LecipmDisputePredictionPattern` |
| `dispute-prevention-actions.service.ts` | Band → operational responses (monitor, reminders, broker visibility, manual review gates) |
| `dispute-prediction-explainability.service.ts` | Human-readable explanations + safety footer |
| `dispute-prediction-dashboard.service.ts` | Admin dashboard + autonomy command-center payloads |

## Safety boundaries

- Outputs are **probabilistic** and explainable.
- No automatic punitive listing/account actions inside this module — escalation is **manual review queues** and **policy-gated** automation hints.
- “Predicted category” maps to coarse friction families (payment, negotiation, documentation, etc.), not adjudication.

## Measurement

- Snapshots stored in `lecipm_dispute_prediction_snapshots`.
- Compare with actual `lecipm_dispute_cases` via entity keys — full precision KPIs belong in analytics warehouse joins.
