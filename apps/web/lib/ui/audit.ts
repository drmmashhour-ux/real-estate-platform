import "server-only";

/**
 * Re-export: keep UI audit entry on the server boundary (do not import this file from client).
 * Tests and `readiness` may import `@/lib/ui/auditHeuristics` directly.
 */
export { runUIAudit, type UIAuditResult } from "@/lib/ui/auditHeuristics";
