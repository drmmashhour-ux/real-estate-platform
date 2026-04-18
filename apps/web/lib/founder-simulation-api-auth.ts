import { founderSimulationFlags, lecipmLaunchInvestorFlags, launchSystemV1Flags } from "@/config/feature-flags";
import { requirePlatformLaunchInvestor, type PlatformLaunchAuth } from "@/lib/launch-investor-api-auth";

/**
 * Platform executive + launch console + founder simulation flags.
 * All founder simulation/pitch APIs require platform (ADMIN) scope — no cross-tenant scraping.
 */
export async function requireFounderSimulationSession(): Promise<PlatformLaunchAuth> {
  const base = await requirePlatformLaunchInvestor();
  if (!base.ok) return base;
  const launchOn =
    lecipmLaunchInvestorFlags.lecipmLaunchInvestorSystemV1 || launchSystemV1Flags.launchSystemV1;
  if (!launchOn) {
    return { ok: false, response: Response.json({ error: "Launch investor system disabled" }, { status: 403 }) };
  }
  if (!founderSimulationFlags.founderLaunchSimulationV1) {
    return { ok: false, response: Response.json({ error: "Founder launch simulation disabled" }, { status: 403 }) };
  }
  if (!founderSimulationFlags.montrealProjectionV1) {
    return { ok: false, response: Response.json({ error: "Montreal projection module disabled" }, { status: 403 }) };
  }
  return base;
}

export async function requireFounderPitchSession(): Promise<PlatformLaunchAuth> {
  const base = await requirePlatformLaunchInvestor();
  if (!base.ok) return base;
  const launchOn =
    lecipmLaunchInvestorFlags.lecipmLaunchInvestorSystemV1 || launchSystemV1Flags.launchSystemV1;
  if (!launchOn) {
    return { ok: false, response: Response.json({ error: "Launch investor system disabled" }, { status: 403 }) };
  }
  if (!founderSimulationFlags.investorPitchWordingV1) {
    return { ok: false, response: Response.json({ error: "Investor pitch wording disabled" }, { status: 403 }) };
  }
  return base;
}

/** Pitch / Markdown / PDF-ready JSON exports — `FEATURE_PITCH_EXPORT_V1`. */
export async function requireFounderPitchExportSession(): Promise<PlatformLaunchAuth> {
  const base = await requirePlatformLaunchInvestor();
  if (!base.ok) return base;
  if (!founderSimulationFlags.pitchExportV1) {
    return { ok: false, response: Response.json({ error: "Pitch export disabled" }, { status: 403 }) };
  }
  return base;
}

/** Simulation table exports (JSON/CSV/MD) — same gates as simulation APIs. */
export async function requireFounderSimulationExportSession(): Promise<PlatformLaunchAuth> {
  return requireFounderSimulationSession();
}
