# Team structure (BNHub / LECIPM)

Clear roles, hierarchy, and ownership so the team scales without confusion. For **how we ship code**, see **`team-workflow.md`**. For **role-level habits**, see **`roles.md`**.

---

## Hierarchy (default startup shape)

```
Founder
├── Full-stack engineer(s)
├── Mobile engineer
├── UI/UX designer
├── Growth / marketing
└── Operations / sales
```

- **Founder** owns strategy, priorities, and final tradeoffs.
- **ICs** own their domain; escalate conflicts or scope fights to Founder.
- As you grow, **lead** titles (e.g. Engineering Lead) can sit between Founder and ICs without changing the core responsibilities below.

---

## Roles at a glance

| Role | Primary accountability |
|------|-------------------------|
| **Founder** | Vision, roadmap, capital, hiring, key partnerships, “what we build next.” |
| **Full-stack engineer** | Web platform, APIs, data, reliability, performance of `apps/web` and shared backend. |
| **Mobile engineer** | `apps/mobile` quality, releases, parity with critical web flows. |
| **UI/UX designer** | Product usability, design system alignment, conversion-oriented UX. |
| **Growth / marketing** | Acquisition, content, ads, funnels, brand—measurable pipeline. |
| **Operations / sales** | Host onboarding, broker/partner pipeline, support SLAs, revenue motion. |

---

## Responsibilities (who does what)

### Founder
- Set **quarterly** focus and **weekly** top-3 priorities.
- Approve hires, budget for tools/ads, and exception policies.
- Own investor/stakeholder narrative; unblock the team on legal/compliance when needed.

### Full-stack engineer
- Implement and maintain features in the monorepo; review PRs; keep CI green.
- Own incident response for web/API with on-call rotation if you add one.

### Mobile engineer
- Ship mobile builds; coordinate API contracts with full-stack; TestFlight / store releases.

### UI/UX designer
- Discovery → prototypes → handoff; usability tests on staging; document patterns for reuse.

### Growth / marketing
- Channel experiments, content calendar, attribution basics; feed learnings into product.

### Operations / sales
- Run playbooks for hosts/brokers; CRM hygiene; feedback loop into product and growth.

---

## Scaling the team

| Stage | Typical change |
|-------|----------------|
| 1–3 people | Founder + 1–2 builders; everyone wears multiple hats; use **`daily-execution.md`**. |
| 4–8 | Split growth vs ops if volume demands; add second engineer or designer. |
| 9+ | Introduce leads per function; keep **one** prioritization forum (weekly sync per **`communication.md`**). |

---

## Related docs

| Doc | Use |
|-----|-----|
| **`roles.md`** | Mission, daily/weekly work, metrics per role |
| **`tasks.md`** | Task types and naming |
| **`hiring.md`** | How to hire into these roles |
| **`onboarding-team.md`** | First-week for new hires |
