/**
 * Advisory simulation JSON only — no side effects, execution, messaging, or payments.
 */
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import type { SimulationActionCategory, SimulationActionInput } from "@/modules/growth/action-simulation.types";
import { simulateActionOutcome } from "@/modules/growth/action-simulation.service";

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

export async function POST(req: Request) {
  if (!engineFlags.actionSimulationV1) {
    return NextResponse.json({ error: "Action simulation is disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title || title.length > 240) {
    return NextResponse.json({ error: "title required (max 240 chars)" }, { status: 400 });
  }

  const category =
    typeof b.category === "string" && CATEGORIES.includes(b.category as SimulationActionCategory)
      ? (b.category as SimulationActionCategory)
      : null;
  if (!category) {
    return NextResponse.json({ error: `category must be one of: ${CATEGORIES.join(",")}` }, { status: 400 });
  }

  const intensity =
    b.intensity === "low" || b.intensity === "medium" || b.intensity === "high" ? b.intensity : null;
  if (!intensity) {
    return NextResponse.json({ error: "intensity must be low | medium | high" }, { status: 400 });
  }

  const windowDays = Math.min(
    45,
    Math.max(7, typeof b.windowDays === "number" && Number.isFinite(b.windowDays) ? Math.round(b.windowDays) : 14),
  );

  const input: SimulationActionInput = {
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

  try {
    const outcome = await simulateActionOutcome(input, { windowDays });
    return NextResponse.json({ outcome, baselineNote: "Simulation uses stored CRM/growth telemetry — not future fact." });
  } catch (e) {
    console.error("[action-simulation]", e);
    return NextResponse.json({ error: "Could not build simulation" }, { status: 500 });
  }
}
