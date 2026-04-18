/**
 * RLS policy presence checks — app server uses privileged Prisma; isolation is enforced in API layer.
 * @see modules/security/rls-policy-check.service.ts
 */
export { verifyRlsPoliciesAndAppLayerExpectations } from "./rls-policy-check.service";
export type { RlsPolicyCheckResult } from "./rls-policy-check.service";
