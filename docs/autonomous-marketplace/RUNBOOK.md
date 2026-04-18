# Autonomous Marketplace — Operator runbook

## Preview (recommended first)

```http
POST /api/autonomy/preview
Content-Type: application/json

{
  "targetType": "fsbo_listing",
  "targetId": "<listing-cuid>",
  "mode": "ASSIST",
  "dryRun": true
}
```

Expect `200` with `{ ok: true, run: { summary, observation, opportunities, actions } }`.

## Dry-run listing analysis

Same as preview — leave `dryRun` true (default).

## Execution in safe assist mode

Enable execution toggles for task-like actions:

```
AUTONOMY_EXEC_CREATE_TASK=true
AUTONOMY_EXEC_FLAG_REVIEW=true
```

Then:

```http
POST /api/autonomy/run/listing
Content-Type: application/json

{
  "listingId": "<listing-cuid>",
  "mode": "ASSIST",
  "dryRun": false,
  "idempotencyKey": "listing-<id>-2026-04-02T12:00:00Z"
}
```

## Idempotency

Reuse `idempotencyKey` within ~1h to retrieve the stored run payload from `summary_json` without recomputing detectors.

## Logs

grep Cloud logs for prefixes:

- `[autonomous-marketplace]`
- `[autonomous-marketplace][policy]`
- `[autonomous-marketplace][execution]`

Never log Stripe secrets, raw payment payloads, or full PII.

## Failure modes

| Symptom | Check |
|---------|-------|
| 403 | `FEATURE_AUTONOMOUS_MARKETPLACE_V1` off or non-admin |
| 500 persist | DB migration applied? Prisma client regenerated? |
| Always DRY_RUN | `dryRun` true or governance/policy blocked |
