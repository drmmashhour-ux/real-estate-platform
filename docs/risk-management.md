# Risk management — BNHub + LECIPM

Identify risks early; **mitigate** with owners and measurable controls. Review quarterly and after incidents.

---

## Technical risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| DB / API outage | Bookings stop | Multi-AZ DB, health checks, runbooks, status page |
| Data loss | Legal + trust | Backups, restore drills, PITR where available |
| Slow search at scale | Conversion drop | Indexes, caching, query budgets, CDN |
| Dependency CVE | Compromise | Automated scans, patch SLAs |

---

## Legal / compliance

| Risk | Impact | Mitigation |
|------|--------|------------|
| Local STR regulations | Fines / takedown | Per-city legal memo; geo-gating listings |
| Privacy complaint | Investigation | Data map, DSR process, subprocessors list |
| Payment licensing | Ops freeze | Counsel + compliant processor setup |

---

## Operational

| Risk | Impact | Mitigation |
|------|--------|------------|
| Support backlog | Churn | Staffing model, macros, self-serve FAQs |
| Partner quality variance | Trust hit | SLAs, monitoring, pause clauses |
| Key person dependency | Stalls | Runbooks, cross-training |

---

## Fraud / abuse

| Risk | Impact | Mitigation |
|------|--------|------------|
| Synthetic listings | Guest harm | Verification + ML/heuristics + human review |
| Chargeback rings | Revenue loss | Velocity rules, device/IP signals |
| Review manipulation | Distorted discovery | Graph checks, penalties |

---

## Reputational

- **Under-reaction** to safety — long-term brand damage.  
- **Over-promising** in marketing — short-term spike, long-term distrust.

**Mitigation:** Align comms with [brand-strategy.md](brand-strategy.md) and trust policies.

---

## Reporting

- **Founder / exec dashboard:** incident count, MTTR, dispute rate, chargeback rate, NPS (if collected).  
- **Post-incident:** blameless postmortem + tracked action items.
