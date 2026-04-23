# Autonomy Operations Layer

The Autonomy Operations Layer provides a daily operational control surface for administrators to govern, monitor, and intervene in the LECIPM Autonomy OS.

## Core Components

### 1. Approval Inbox
All high-risk or policy-flagged autonomous actions are queued for human review.
- **Location**: `modules/autonomy/dashboard/autonomy-approval-inbox.tsx`
- **Flow**: Action Generated -> Policy Engine Flags -> Queue for Approval -> Admin Review -> Execute/Reject.
- **Capabilities**: View rationale, inspect proposed changes, provide rejection reasons.

### 2. Rollback Controls
Allows for the safe reversal of recent autonomous decisions.
- **Location**: `modules/autonomy/dashboard/autonomy-rollback-panel.tsx`
- **Supported Domains**: Pricing adjustments, recommendation states, portfolio allocations.
- **Audit**: Every rollback requires a reason and is logged with the actor's identity.

### 3. Domain Kill Switches
Emergency overrides to immediately disable autonomy for specific functional domains.
- **Location**: `modules/autonomy/dashboard/autonomy-kill-switches.tsx`
- **Domains**: Pricing, Learning, Actions, Portfolio Allocator, Outbound Marketing, Recommendations.
- **Behavior**: When disabled, the autonomy engine skips all logic for that domain and falls back to manual/off.

### 4. Policy Trends & Analytics
Visual tracking of how the autonomy engine is performing against established policies.
- **Location**: `modules/autonomy/dashboard/autonomy-policy-trends.tsx`
- **Metrics**: Decision counts, block rates, human intervention frequency, outcome success rates.

### 5. AI Mode Recommendation
An intelligence layer that analyzes recent performance to suggest the optimal autonomy mode.
- **Modes**: OFF, ASSIST, SAFE_AUTOPILOT, FULL_AUTOPILOT_APPROVAL.
- **Factors**: Failure rates, risk density, data quality, and recent approval trends.

## Operator Workflow

1. **Morning Review**: Check the **Recommended Mode Banner** for any suggested changes to system stance.
2. **Approval Processing**: Process all items in the **Approval Inbox** to keep the pipeline moving.
3. **Trend Monitoring**: Review **Policy Trends** to identify any domains with rising block rates (policy misalignment).
4. **Emergency Intervention**: Use **Kill Switches** if a specific domain is behaving unexpectedly.
5. **Correction**: Use **Rollback** for any decisions that were approved but later found to be sub-optimal.

## Audit Logging

Every interaction in the Operations Layer is persisted in `AutonomyExecutionAuditLog`:
- Approvals/Rejections
- Rollbacks
- Kill Switch Toggles
- Mode Changes

## Technical Reference

### API Routes
- `GET /api/autonomy/approvals`: List pending actions.
- `POST /api/autonomy/approvals/[id]`: Approve or reject an action.
- `POST /api/autonomy/rollback/[id]`: Revert an executed action.
- `POST /api/autonomy/kill-switches/toggle`: Enable/disable a domain.
- `GET /api/autonomy/mode-recommendation`: Get AI-driven mode suggestion.

### Mobile Support
Lightweight summaries are exposed via `/api/mobile/admin/autonomy/*` for on-the-go monitoring and urgent approvals.
