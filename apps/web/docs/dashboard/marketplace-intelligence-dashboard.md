# Marketplace intelligence dashboard

Admin JSON surface: `GET /api/admin/dashboard-intelligence` (requires `FEATURE_MARKETPLACE_DASHBOARD_V1`).

## Purpose

Investor-grade **read-only** aggregation of flags and placeholder KPI slots. Deterministic; empty aggregates return explicit notes — no fabricated metrics.

## Future wiring

Connect growth, legal, trust, and ranking services behind the same guardrails (no raw PII in responses).
