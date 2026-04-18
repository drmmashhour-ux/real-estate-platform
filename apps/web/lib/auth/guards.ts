/**
 * Barrel — LECIPM Production Infrastructure v1 auth helpers.
 * Prefer importing from the specific modules in new code.
 */
export type { SessionUser } from "@/lib/auth/get-session";
export { getSession } from "@/lib/auth/get-session";
export type { AuthResult } from "@/lib/auth/require-user";
export { requireUser } from "@/lib/auth/require-user";
export type { AppRouteRole } from "@/lib/auth/require-role";
export { requireRole } from "@/lib/auth/require-role";
