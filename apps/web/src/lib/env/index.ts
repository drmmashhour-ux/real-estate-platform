/**
 * LECIPM Environment — centralized env access.
 *
 * Build-safe: no env var read throws during SSR/build unless explicitly required.
 * Runtime-safe: placeholder guard prevents fake DB URLs from reaching PrismaClient.
 */

export { isHubEnabled } from "./features";
export {
  FEATURE_CORE,
  FEATURE_HOMES,
  FEATURE_BNHUB,
  FEATURE_INVEST,
  FEATURE_FORMS,
  FEATURE_IMMOCONTACT,
  FEATURE_DR_BRAIN,
  FEATURE_COMPLIANCE,
  FEATURE_COMPLIANCE_HARD_LOCK,
  FEATURE_GROWTH,
  FEATURE_DESIGN_SYSTEM,
} from "./features";
export {
  requireRuntimeEnv,
  optionalRuntimeEnv,
  isVercelBuild,
  isDevelopment,
  isProduction,
} from "./runtime";
