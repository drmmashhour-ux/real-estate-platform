import { lecipmLaunchInvestorFlags, launchSystemV1Flags } from "@/config/feature-flags";
import { requirePlatformLaunchInvestor, type PlatformLaunchAuth } from "@/lib/launch-investor-api-auth";

/**
 * Platform admin + (Launch System v1 **or** legacy Launch/Investor bundle).
 */
export async function requireLaunchSystemPlatform(): Promise<PlatformLaunchAuth> {
  const r = await requirePlatformLaunchInvestor();
  if (!r.ok) return r;
  const on = launchSystemV1Flags.launchSystemV1 || lecipmLaunchInvestorFlags.lecipmLaunchInvestorSystemV1;
  if (!on) {
    return { ok: false, response: Response.json({ error: "Launch system disabled" }, { status: 403 }) };
  }
  return r;
}
