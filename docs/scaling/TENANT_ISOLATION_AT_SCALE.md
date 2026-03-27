# Tenant isolation at scale

Tenant safety must hold when traffic, caches, jobs, and aggregates multiply. **Scaling infrastructure does not fix bad isolation logic.**

---

## Non-negotiables

1. **Queries remain tenant-scoped** in the service layer (and in raw SQL). Every list/detail path must include the tenant dimension your schema uses (`tenantId`, org id, or equivalent).
2. **Cache keys include tenant (and user when row-level permissions exist).** Never key by global resource id alone if the same id could be referenced in a cache from another tenant’s context.
3. **Exports and analytics** respect tenant boundaries. Cross-tenant aggregates are **admin-only** with explicit tooling, auth, and audit.
4. **Background jobs** carry `tenantId` (or process in a defined global context with safeguards). Batch jobs should iterate tenants in bounded chunks.
5. **Document access** re-validates permissions per signed URL generation or per app-mediated download—even if an object key was guessed.
6. **Membership checks** can be optimized (short-lived cache of “user U belongs to tenant T”) but must **not** be bypassed for convenience.

---

## Risks introduced by scaling

| Risk | How it manifests | Mitigation |
|------|------------------|------------|
| Cache bleed | Wrong key → User A sees User B’s summary | Tenant+user in key; bust on role/tenant change |
| Replica lag | User writes then reads stale read replica | Session stickiness to primary for “read your writes” paths, or short delay tolerance |
| Batch exports | Job reads too broadly | Explicit tenant filter in every query; limit batch size |
| Aggregated metrics | Dashboard mixes tenants | Separate materialized tables per tenant or strict `GROUP BY tenant` |
| Search indices | Global index without tenant filter | Tenant as mandatory filter in search queries |

---

## Cached and aggregated paths

- **Precomputed dashboards:** Each row or blob must be keyed and query-filtered by tenant.
- **Admin “god view”:** Separate code paths and caches from tenant user paths; audit access.
- **Message bus / events:** Include `tenantId` in every event envelope for consumers.

---

## Testing and verification

- Automated tests for **cross-tenant denial** on representative APIs.
- Periodic **integrity jobs** to detect orphan rows or mismatched `tenantId` references.
- Penetration testing on document URLs and ID-guess scenarios for high-risk tenants.

---

## Relation to other docs

- [CACHING_STRATEGY](./CACHING_STRATEGY.md) — key patterns.
- [BOTTLENECKS_AND_LIMITS](./BOTTLENECKS_AND_LIMITS.md) — membership check performance.
- [BACKGROUND_JOBS_PLAN](./BACKGROUND_JOBS_PLAN.md) — tenant context in jobs.
