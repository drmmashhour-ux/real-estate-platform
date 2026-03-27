# Backup strategy

- **Database:** rely on managed Postgres continuous archiving and daily logical exports (`scripts/backup-db.ts` orchestrates provider-specific steps).
- **Object storage:** versioned buckets for documents and generated PDFs; lifecycle rules for old versions.
- **Secrets:** stored in the deployment platform; not in git.

Test restores quarterly using `RESTORE_PROCEDURE.md`.
