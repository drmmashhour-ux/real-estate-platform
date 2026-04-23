import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { marketplaceFlywheelFlags } from "@/config/feature-flags";
import {
  getFlywheelActionById,
  updateFlywheelActionStatus,
} from "@/modules/growth/flywheel-action.service";
import type { FlywheelActionStatus } from "@/modules/growth/flywheel-action.types";
import { listOutcomesForAction } from "@/modules/growth/flywheel-outcome.service";

export const dynamic = "force-dynamic";

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

/** GET — single action + recent outcomes when outcomes flag on */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminFlywheelActions();
  if ("error" in gate) return gate.error;

  const { id } = await params;
  const action = await getFlywheelActionById(id);
  if (!action) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const outcomes =
    marketplaceFlywheelFlags.marketplaceFlywheelOutcomesV1 ? await listOutcomesForAction(id, 30) : [];

  return NextResponse.json({ action, outcomes });
}

/** PATCH — status update only */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminFlywheelActions();
  if ("error" in gate) return gate.error;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = typeof body.status === "string" ? (body.status as FlywheelActionStatus) : null;
  const allowed: FlywheelActionStatus[] = [
    "proposed",
    "acknowledged",
    "in_progress",
    "completed",
    "abandoned",
  ];
  if (!status || !allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await updateFlywheelActionStatus(id, status, gate.userId);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ action: updated });
}
