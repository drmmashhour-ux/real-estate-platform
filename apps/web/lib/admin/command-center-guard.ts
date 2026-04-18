import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { commandCenterFlags } from "@/config/feature-flags";

type Gate = "command" | "executive" | "intel";

export async function requireAdminCommandCenterGate(which: Gate) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return {
      denied: NextResponse.json({ ok: false as const, error: auth.error }, { status: auth.status }),
    };
  }
  const ok =
    (which === "command" && commandCenterFlags.commandCenterV1) ||
    (which === "executive" && commandCenterFlags.executiveDashboardV1) ||
    (which === "intel" && commandCenterFlags.marketIntelligenceDashboardV1);
  if (!ok) {
    return {
      denied: NextResponse.json({ ok: false as const, error: "Feature disabled" }, { status: 403 }),
    };
  }
  return { ok: true as const, userId: auth.userId };
}

/** Insights endpoints: allow command center **or** MI dashboard flag. */
export async function requireAdminMarketInsightsApi() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return {
      denied: NextResponse.json({ ok: false as const, error: auth.error }, { status: auth.status }),
    };
  }
  if (
    !commandCenterFlags.commandCenterV1 &&
    !commandCenterFlags.marketIntelligenceDashboardV1
  ) {
    return {
      denied: NextResponse.json({ ok: false as const, error: "Feature disabled" }, { status: 403 }),
    };
  }
  return { ok: true as const, userId: auth.userId };
}
