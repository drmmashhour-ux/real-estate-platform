# Admin AI and legal document safety

## Rules (non-negotiable product posture)

1. **Never auto-finalize legal documents** — AI may draft or suggest; a **broker or admin** must explicitly approve before anything is presented as final or filed.
2. **Review gates** — Legal/deal flows should keep human-in-the-loop checkpoints in UI and server actions.
3. **No cross-context PII leakage** — Admin AI tools must not embed one user’s private data into another user’s session; scope RAG and prompts by `workspaceId` / `userId` as applicable.
4. **High-risk operations** — Use `securityLog` / audit tables for destructive or sensitive admin AI actions (extend `SecurityEventName` as needed).

## Implementation notes

- Permission checks: reuse `requireAdminControlUserId`, `requireAdminSession`, broker CRM guards.
- Logging: `apps/web/lib/security/security-logger.ts` + `PlatformEvent` with `sourceModule: "security"`.

## Related

- [security-audit.md](./security-audit.md)  
- [README.md](./README.md)  
