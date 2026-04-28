import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import {
  getSyriaInvestorDemoExpiresAtIso,
  getSyriaInvestorDemoRuntimeEnabled,
  setSyriaInvestorDemoExpiresAt,
  setSyriaInvestorDemoRuntimeEnabled,
} from "@/lib/demo/runtime-flags";
import { acknowledgeManualDemoEnable, getDemoAutoDisabledBanner } from "@/lib/sybnb/demo-safety";
import { isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";

/** Failsafe TTL when demo runtime is turned ON via this API (process memory only). */
const DEMO_TOGGLE_RUNTIME_TTL_MS = 60 * 60 * 1000;

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  const banner = getDemoAutoDisabledBanner();
  return NextResponse.json({
    ok: true,
    app: "syria" as const,
    runtimeEnabled: getSyriaInvestorDemoRuntimeEnabled(),
    expiresAtIso: getSyriaInvestorDemoExpiresAtIso() ?? null,
    effective: isInvestorDemoModeActive(),
    autoDisabledReason: banner?.reason ?? null,
    autoDisabledAt: banner?.timestamp ?? null,
  });
}

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const enabled =
    typeof body === "object" &&
    body !== null &&
    "enabled" in body &&
    typeof (body as { enabled: unknown }).enabled === "boolean"
      ? (body as { enabled: boolean }).enabled
      : null;

  if (enabled === null) {
    return NextResponse.json({ ok: false, message: "Body must include enabled: boolean" }, { status: 400 });
  }

  if (enabled) {
    acknowledgeManualDemoEnable();
    setSyriaInvestorDemoExpiresAt(new Date(Date.now() + DEMO_TOGGLE_RUNTIME_TTL_MS).toISOString());
    setSyriaInvestorDemoRuntimeEnabled(true);
  } else {
    setSyriaInvestorDemoExpiresAt(null);
    setSyriaInvestorDemoRuntimeEnabled(false);
  }
  console.warn("[DEMO MODE]", {
    action: "runtime_toggle",
    app: "syria",
    enabled,
    timestamp: new Date().toISOString(),
  });

  const bannerAfter = getDemoAutoDisabledBanner();
  return NextResponse.json({
    ok: true,
    app: "syria" as const,
    runtimeEnabled: getSyriaInvestorDemoRuntimeEnabled(),
    expiresAtIso: getSyriaInvestorDemoExpiresAtIso() ?? null,
    effective: isInvestorDemoModeActive(),
    autoDisabledReason: bannerAfter?.reason ?? null,
    autoDisabledAt: bannerAfter?.timestamp ?? null,
  });
}
