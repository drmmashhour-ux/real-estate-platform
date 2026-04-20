/**
 * Advisory A/B ranking of two scenarios — same baseline; no mutations.
 */
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { compareSimulatedActions } from "@/modules/growth/action-simulation-comparison.service";
import type { SimulationActionCategory, SimulationActionInput } from "@/modules/growth/action-simulation.types";

export const dynamic = "force-dynamic";

const CATEGORIES: SimulationActionCategory[] = [
  "broker_acquisition",
  "demand_generation",
  "supply_growth",
  "conversion_fix",
  "routing_shift",
  "timing_focus",
  "city_domination",
  "retention_focus",
];

function parseAction(raw: unknown): SimulationActionInput | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title || title.length > 240) return null;
  const category =
    typeof b.category === "string" && CATEGORIES.includes(b.category as SimulationActionCategory)
      ? (b.category as SimulationActionCategory)
      : null;
  if (!category) return null;
  const intensity =
    b.intensity === "low" || b.intensity === "medium" || b.intensity === "high" ? b.intensity : null;
  if (!intensity) return null;
  const windowDays = Math.min(
    45,
    Math.max(
      7,
      typeof b.windowDays === "number" && Number.isFinite(b.windowDays) ? Math.round(b.windowDays) : 14,
    ),
  );
  return {
    id: typeof b.id === "string" && b.id.trim() ? b.id.trim() : randomUUID(),
    title,
    category,
    targetCity: typeof b.targetCity === "string" ? b.targetCity.trim().slice(0, 120) : undefined,
    targetBrokerId: typeof b.targetBrokerId === "string" ? b.targetBrokerId.trim().slice(0, 80) : undefined,
    targetSystem: typeof b.targetSystem === "string" ? b.targetSystem.trim().slice(0, 80) : undefined,
    intensity,
    windowDays,
    rationale: typeof b.rationale === "string" ? b.rationale.trim().slice(0, 1000) : undefined,
  };
}

export async function POST(req: Request) {
  if (!engineFlags.actionSimulationV1 || !engineFlags.actionSimulationComparisonV1) {
    return NextResponse.json({ error: "Action simulation comparison is disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const a = parseAction(o.actionA);
  const b = parseAction(o.actionB);
  if (!a || !b) {
    return NextResponse.json({ error: "actionA and actionB must include title, category, intensity, windowDays" }, { status: 400 });
  }

  try {
    const cmp = await compareSimulatedActions(a, b);
    return NextResponse.json({ comparison: cmp });
  } catch (e) {
    console.error("[action-simulation]", e);
    return NextResponse.json({ error: "Could not compare simulations" }, { status: 500 });
  }
}
