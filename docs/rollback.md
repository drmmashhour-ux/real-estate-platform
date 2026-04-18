# Rollback & recovery — LECIPM

## Vercel (instant)

1. Dashboard → Project → **Deployments**  
2. Select last known-good **Production** deployment  
3. **Promote to Production** or **Rollback**

## Feature flags (fast mitigation)

- Toggle env-backed flags in `apps/web/config/feature-flags.ts` (`deploymentSafetyFlags`, engine groups).  
- Redeploy not always required for env-only toggles on Vercel.

## Git revert

```bash
git revert <merge-commit-sha>
git push origin main
```

## Supabase

- Enable **Point-in-Time Recovery (PITR)** on production projects where available.  
- Document RPO/RTO with your team.  
- Application backups: follow Supabase dashboard backup schedule.

## Related

- [deployment.md](./deployment.md)  
- [incident-response.md](./incident-response.md)  
- [release-checklist.md](./release-checklist.md)
