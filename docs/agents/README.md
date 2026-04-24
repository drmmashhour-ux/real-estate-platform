# Multi-Agent Learning Coordination System

Independent AI agents operating across multiple domains (pricing, ranking, messaging) with competitive learning and safety governance.

## Goal
Allow specialized agents to learn independently, compete for production exposure, and share strategic improvements while respecting strict platform safety rules.

## Core Components

### AiAgent
Represents a specialized AI model or strategy engine.
- Tracks performance scores and status.
- Restricted to specific domains (e.g., `pricing`, `ranking`).

### Competition Engine
- Compares agents within the same domain.
- Promotes winners by increasing their exposure score.
- Demotes or pauses underperforming agents.

### Coordination & Safety
- **Policy Caps**: All agent-proposed adjustments are bounded by global platform safety rules (e.g., max price delta).
- **Audit Stream**: Every proposal and outcome is logged with the `[agents]` tag.
- **Human Governance**: Agents cannot mutate production settings directly; they propose `RolloutPolicies` or `EvolutionPolicyAdjustments`.

## Experimentation Lifecycle
1.  **Proposal**: Agent proposes a strategy key and payload.
2.  **Validation**: System checks proposal against domain safety caps.
3.  **Competition**: Agent participates in A/B or Multi-Armed Bandit experiments.
4.  **Learning**: Outcomes are recorded and mapped back to the agent's performance score.
5.  **Selection**: Top-performing agents gain higher weight in the production ensemble.

---
Agent OS v1.0.0
