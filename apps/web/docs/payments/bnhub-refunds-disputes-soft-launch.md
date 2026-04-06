# BNHub Refunds And Disputes Soft Launch Policy

## Goal

Launch BNHub payments with refund and dispute handling that is:

- safe for a Canada-first rollout
- easy for support to operate
- low risk for guests, hosts, and platform cash flow
- consistent with destination charges on Stripe Connect

This policy intentionally prefers **manual review** over aggressive automation for edge cases.

## Launch Principles

- BNHub uses **destination charges**
- The platform is the primary payment control layer
- Booking payment confirmation is separate from host payout completion
- Refunds, disputes, and payout holds must be tracked separately
- Soft launch should optimize for **confidence and correctness**, not maximum automation

## Launch Scope

At soft launch, BNHub should support:

- full refund
- partial refund
- host cancellation refund
- guest issue intake
- dispute intake
- payout hold on dispute
- manual support review for complex refund/dispute outcomes

At soft launch, BNHub should avoid fully automated:

- host debit recovery after dispute loss
- automatic transfer reversal strategy branching
- automatic policy decisions for every dispute reason
- automated cross-border settlement logic changes

## Refund Policy

### Allowed Refund Types At Soft Launch

#### 1. Full refund

Use for:

- host cancellation
- booking impossible to fulfill
- major platform or listing issue
- support-approved guest protection case

Operational expectation:

- refund is platform-approved
- booking status is updated
- payout state is reviewed before any host release

#### 2. Partial refund

Use for:

- partial stay issue
- amenity or listing mismatch with partial compensation
- support-approved goodwill adjustment

Operational expectation:

- refund amount must be explicit
- support records the reason
- payout state remains visible and reviewable

#### 3. No refund

Use for:

- policy-based denial outside approved windows
- support review concludes refund not warranted

Operational expectation:

- reason is recorded
- host payout remains governed by normal payout and hold rules

## Refund Process

### Recommended BNHub Flow

1. Guest or support opens issue/refund request
2. Booking is reviewed against policy
3. Support decides:
   - full refund
   - partial refund
   - no refund
4. Refund request is created in BNHub
5. Refund is executed through Stripe
6. Stripe webhook updates refund/payment truth
7. Booking and payout states are updated in BNHub

### Soft Launch Guardrails

- Do not automatically reverse host-side economics in every refund scenario
- For soft launch, support should explicitly review whether payout release should be held, delayed, or left as-is
- If host funds may already be unavailable, do not assume automatic recovery from host balance

## Dispute Policy

### What Counts As A Dispute At Soft Launch

- guest reports major stay issue
- guest opens formal dispute/chargeback externally
- support escalates an unresolved issue into a dispute case

### Immediate BNHub Actions On Dispute

When a dispute is opened:

- create dispute record
- lock or hold payout release
- flag the booking for support review
- request evidence from host when appropriate
- track dispute lifecycle separately from payment confirmation

### Manual-First Rule

At soft launch:

- the platform should manually review every dispute
- the platform should not automatically debit hosts after a dispute loss
- any host recovery decision should be reviewed by support and legal/business policy first

This reduces risk while policies and host terms are still maturing.

## Payout Hold Policy

### When To Hold Payouts

Hold payout release when:

- a dispute is opened
- a major refund request is under review
- support or trust/safety flags the booking
- payout failure or account issue is detected

### When To Release Payouts

Release payout only when:

- booking payment is confirmed
- no active refund/dispute blocks remain
- host account readiness is healthy
- support review clears the booking when a case existed

### Key Product Rule

Guest payment success does **not** mean the host has been safely paid out to bank.

## Minimum Data BNHub Must Track

### Refunds

- booking id
- reservation payment id
- refund id
- refund type
- refund amount
- refund status
- reason code
- initiated by
- processor refund id
- created at / updated at

### Disputes

- booking id
- reservation payment id
- dispute id
- processor dispute id
- dispute amount
- dispute status
- summary
- evidence state
- created at / updated at

### Payout / hold state

- scheduled payout time
- payout hold reason
- payout released at
- payout status in BNHub host payout records

## UI / Support Language

### Guest-facing

Use:

- `Refund requested`
- `Refund under review`
- `Refund processed`
- `Issue under review`
- `Payment disputed`

Avoid:

- technical Stripe object language
- promising refund timing that support has not confirmed

### Host-facing

Use:

- `Guest paid`
- `Payout scheduled`
- `Payout on hold`
- `Payout paid`
- `Payout failed`
- `Dispute under review`

Avoid:

- wording that implies guest complaints always mean host fault
- wording that implies payout is irreversible before support review

## Soft Launch Support Decision Tree

### Guest asks for refund

1. Check booking status
2. Check payment status
3. Check whether payout has been scheduled or held
4. Decide:
   - full refund
   - partial refund
   - no refund
5. Record support reason
6. Execute or deny

### Guest opens dispute / chargeback

1. Lock payout release
2. Create or update dispute case
3. Collect host evidence
4. Track Stripe dispute lifecycle
5. Support decides whether platform absorbs or later seeks host recovery

### Host asks why payout is delayed

1. Check connected account readiness
2. Check payout hold reason
3. Check whether refund/dispute is active
4. Communicate the exact reason:
   - account onboarding incomplete
   - dispute hold
   - refund review hold
   - payout processor issue

## Soft Launch Recommendations

For the first launch window:

- every refund above a small threshold should be manually reviewed
- every dispute should be manually reviewed
- no automatic host recovery after dispute loss
- document decisions in support notes
- monitor cash-flow impact before automating advanced recovery logic

## Stripe Questions Still Worth Forwarding

Forward these to Stripe if you want to harden refund/dispute behavior before later automation:

1. For destination charges in a Canada-first marketplace, what refund pattern does Stripe recommend when the platform wants to protect the guest but avoid accidental host overpayment recovery issues?
2. After host payout has already reached the connected account balance or bank payout flow, what is Stripe’s recommended approach for safe reversal or recovery in a marketplace like this?
3. For destination charges, what is Stripe’s preferred operational distinction between:
   - refunding the charge
   - reversing the transfer
   - handling payout failures
4. Are there any Canada-specific limitations or recommendations for refunding destination charges tied to Express connected accounts?
5. For disputes on destination charges, what does Stripe recommend as the safest marketplace pattern when the platform may later choose to recover some cost from the host?

## Final Recommendation

For soft launch, BNHub should be:

- automated for booking payment confirmation
- automated for basic refund/dispute state recording
- automated for payout holds on disputes
- manual for final refund/dispute resolution decisions
- manual for host recovery decisions after dispute loss

This is the safest path to launch with confidence while keeping operational risk under control.
