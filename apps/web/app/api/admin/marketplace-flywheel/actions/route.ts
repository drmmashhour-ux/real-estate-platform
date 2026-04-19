import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { marketplaceFlywheelFlags } from "@/config/feature-flags";
import {
  createFlywheelAction,
  listFlywheelActionsWithLatestOutcome,
} from "@/modules/growth/flywheel-action.service";
import type { MarketplaceFlywheelInsightType } from "@/modules/marketplace/flywheel.types";
import type { FlywheelActionStatus, FlywheelActionType } from "@/modules/growth/flywheel-action.types";

export const dynamic = "force-dynamic";

const VALID_STATUS: FlywheelActionStatus[] = [
  "proposed",
  "acknowledged",
  "in_progress",
  "completed",
  "abandoned",
];

function parseStatus(raw: string | null): FlywheelActionStatus | undefined {
  if (!raw) return undefined;
  return VALID_STATUS.includes(raw as FlywheelActionStatus) ? (raw as FlywheelActionStatus) : undefined;
}

async function requireAdminFlywheelActions() {
  if (!marketplaceFlywheelFlags.marketplaceFlywheelActionsV1) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  const userId = await getGuestId();
  if (!userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { userId };
}

/** GET — list tracked actions */
export async function GET(req: Request) {
  const gate = await requireAdminFlywheelActions();
  if ("error" in gate) return gate.error;

  const url = new URL(req.url);
  const status = parseStatus(url.searchParams.get("status"));

  const actions = await listFlywheelActionsWithLatestOutcome({
    take: 100,
    status,
  });

  return NextResponse.json({ actions });
}

/** POST — create operator action tied to insight */
export async function POST(req: Request) {
  const gate = await requireAdminFlywheelActions();
  if ("error" in gate) return gate.error;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const insightId = typeof body.insightId === "string" ? body.insightId.trim() : "";
  const insightType = body.insightType as MarketplaceFlywheelInsightType | undefined;

  const validInsights: MarketplaceFlywheelInsightType[] = [
    "supply_gap",
    "demand_gap",
    "conversion_opportunity",
    "broker_gap",
    "pricing_opportunity",
  ];

  if (!insightId || !insightType || !validInsights.includes(insightType)) {
    return NextResponse.json({ error: "insightId and valid insightType required" }, { status: 400 });
  }

  try {
    const requestedStatus =
      typeof body.status === "string" && VALID_STATUS.includes(body.status as FlywheelActionStatus)
        ? (body.status as FlywheelActionStatus)
        : undefined;

    const requestedType =
      typeof body.actionType === "string"
        ? (body.actionType as FlywheelActionType)
        : undefined;

    const action = await createFlywheelAction({
      insightId,
      insightType,
      createdByUserId: gate.userId,
      note: typeof body.note === "string" ? body.note : null,
      status: requestedStatus,
      actionType: requestedType,
      evaluationWindowDays:
        typeof body.evaluationWindowDays === "number" ? body.evaluationWindowDays : undefined,
    });

    return NextResponse.json({ action });
  } catch (e) {
    if (e instanceof Error && e.message === "Invalid actionType") {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create action" }, { status: 500 });
  }
}
