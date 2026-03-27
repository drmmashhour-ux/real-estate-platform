# Restore procedure

1. Stop traffic to the affected environment or enable read-only mode.
2. Restore the latest consistent backup to a new database instance; verify checksums and row counts for critical tables.
3. Run `npx prisma migrate deploy` if schema drift is possible.
4. Replay WAL or incremental backups only per vendor guidance.
5. Validate application health (`scripts/perf-baseline.ts` smoke checks), then cut over DNS or connection strings.

Document the incident ticket and root cause before returning to normal operations.
