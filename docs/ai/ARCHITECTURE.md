# Architecture

## Layout (`apps/web/lib/ai/`)

| Area | Path | Responsibility |
|------|------|----------------|
| Autonomy core | `autonomy/` | State, engine, runner, router, scheduler, rules |
| Agents | `agents/` | Domain prompts + lifecycle helpers |
| Tools | `tools/registry.ts` | Typed DB reads / safe writes |
| Policies | `policies/` | Action class, risk, domain, compliance |
| Planning | `planning/` | Goals → tasks → tool selection |
| Execution | `execution/` | Policy-wrapped executor, queue types |
| Memory | `memory/` | Session / user / property context |
| Observability | `observability/` | Counters, health, tracing hooks |
| Recovery | `recovery/` | Retry, circuit breaker, fallback modes |
| Evals | `evals/` | Outcome logging types |
| Autopilot | `autopilot/` | Per-host engine and triggers |
| Actions | `actions/` | Safe execute, automation engine, communications |

## API (`apps/web/app/api/ai/`)

Existing chat, recommendations, execute, automations; added `autonomy/*`, `overrides`, extended `evals` pattern.

## UI (`apps/web/app/(dashboard)/ai/`)

Public URL prefix `/ai` — control center, health, overrides, embedded components under `components/ai/`.
