import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  createRetrofitScenarioRecord,
  ensureRetrofitAccess,
  listRetrofitScenariosForListing,
} from "@/modules/esg/esg-retrofit-planner.service";
import type { RetrofitStrategyType } from "@/modules/esg/esg-retrofit.types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await context.params;
  if (!listingId?.trim()) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const ok = await ensureRetrofitAccess(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const scenarios = await listRetrofitScenariosForListing(listingId);
    return NextResponse.json({
      listingId,
      scenarios: scenarios.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unable to load scenarios" }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await context.params;
  if (!listingId?.trim()) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const ok = await ensureRetrofitAccess(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as {
    scenarioName?: string;
    selectedActionIds?: string[];
    planStrategy?: RetrofitStrategyType;
  };

  const scenarioName = typeof body.scenarioName === "string" ? body.scenarioName.trim() : "";
  const selectedActionIds = Array.isArray(body.selectedActionIds) ? body.selectedActionIds.filter(Boolean) : [];

  if (!scenarioName) return NextResponse.json({ error: "scenarioName required" }, { status: 400 });
  if (selectedActionIds.length === 0) return NextResponse.json({ error: "selectedActionIds required" }, { status: 400 });

  try {
    const result = await createRetrofitScenarioRecord({
      listingId,
      scenarioName,
      selectedEsgActionIds: selectedActionIds,
      planStrategy: body.planStrategy,
    });
    return NextResponse.json({
      scenarioId: result.id,
      bands: result.scenario,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NO_ACTIONS_FOR_SCENARIO") {
      return NextResponse.json({ error: "No matching actions for this scenario" }, { status: 400 });
    }
    return NextResponse.json({ error: "Scenario failed" }, { status: 500 });
  }
}
