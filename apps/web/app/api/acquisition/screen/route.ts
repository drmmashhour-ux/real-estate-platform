import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { runAcquisitionAnalysis } from "@/modules/investment/acquisition.service";
import type { UnderwritingInput } from "@/modules/investment/underwriting.types";
import { isLecipmPhaseEnabled, lecipmRolloutDisabledMeta, logRolloutGate } from "@/lib/lecipm/rollout";

export const dynamic = "force-dynamic";

type Body = Partial<UnderwritingInput>;

function parseBody(raw: unknown): Body | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const purchasePrice = Number(o.purchasePrice);
  const adr = Number(o.adr);
  const occupancyRate = Number(o.occupancyRate);
  const monthlyCost = Number(o.monthlyCost);
  if (![purchasePrice, adr, occupancyRate, monthlyCost].every((n) => Number.isFinite(n))) {
    return null;
  }
  const out: Body = {
    purchasePrice,
    adr,
    occupancyRate,
    monthlyCost,
  };
  if (o.financingRate !== undefined && o.financingRate !== null) {
    const fr = Number(o.financingRate);
    if (Number.isFinite(fr)) out.financingRate = fr;
  }
  if (o.downPayment !== undefined && o.downPayment !== null) {
    const dp = Number(o.downPayment);
    if (Number.isFinite(dp)) out.downPayment = dp;
  }
  return out;
}

function screeningLabel(rec: "buy" | "caution" | "reject"): "PASS" | "CONDITIONAL" | "FAIL" {
  if (rec === "buy") return "PASS";
  if (rec === "caution") return "CONDITIONAL";
  return "FAIL";
}

/**
 * Stateless acquisition screening (no DB persist). Canonical path per LECIPM rollout phase 1.
 * Also available as POST /api/investment/acquisition (persisted run).
 */
export async function POST(req: Request) {
  if (!isLecipmPhaseEnabled(1)) {
    logRolloutGate(1, "/api/acquisition/screen");
    return NextResponse.json({
      screeningLabel: null,
      analysis: null,
      rollout: lecipmRolloutDisabledMeta(1),
    });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = parseBody(raw);
  if (!body) {
    return NextResponse.json(
      {
        error: "Missing or invalid fields",
        required: ["purchasePrice", "adr", "occupancyRate", "monthlyCost"],
      },
      { status: 400 }
    );
  }

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const analysis = runAcquisitionAnalysis(body);
  return NextResponse.json({
    screeningLabel: screeningLabel(analysis.recommendation),
    analysis,
    persisted: false,
  });
}
