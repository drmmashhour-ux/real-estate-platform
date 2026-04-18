/**
 * Founder / executive office APIs — delegates to centralized owner-access (not a raw PlatformRole).
 */
export {
  requireExecutiveSession,
  type ExecutiveAuthResult,
} from "@/modules/owner-access/owner-access.service";
