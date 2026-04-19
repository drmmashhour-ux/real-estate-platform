import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { platformImprovementFlags } from "@/config/feature-flags";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import type { PlatformImprovementQuickAction } from "@/modules/platform/platform-improvement-operator-transitions";
import { nextStatusForQuickAction } from "@/modules/platform/platform-improvement-operator-transitions";
import type { PlatformPriorityStatus } from "@/modules/platform/platform-improvement.types";
import {
  getStoredPriorityStatus,
  transitionOperatorPriorityStatus,
} from "@/modules/platform/platform-improvement-operator-state.service";

export const dynamic = "force-dynamic";

const STATUSES = new Set<PlatformPriorityStatus>([
  "new",
  "acknowledged",
  "planned",
  "in_progress",
  "done",
  "dismissed",
]);

const ACTIONS = new Set<string>(["acknowledge", "plan", "start", "done", "dismiss", "reopen"]);

export async function POST(req: Request) {
  if (!platformImprovementFlags.platformImprovementReviewV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as {
    priorityId?: unknown;
    nextStatus?: unknown;
    action?: unknown;
  } | null;
  const priorityId = typeof body?.priorityId === "string" ? body.priorityId : "";

  let nextStatus: PlatformPriorityStatus | null = null;

  if (typeof body?.action === "string") {
    if (!priorityId || !ACTIONS.has(body.action)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const current = getStoredPriorityStatus(priorityId);
    if (current === undefined) {
      return NextResponse.json({ error: "Unknown priority — refresh the page." }, { status: 400 });
    }
    nextStatus = nextStatusForQuickAction(current, body.action as PlatformImprovementQuickAction);
    if (!nextStatus) {
      return NextResponse.json({ error: "Invalid action for current status" }, { status: 400 });
    }
  } else {
    const nextStatusRaw = typeof body?.nextStatus === "string" ? body.nextStatus : "";
    if (!priorityId || !STATUSES.has(nextStatusRaw as PlatformPriorityStatus)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    nextStatus = nextStatusRaw as PlatformPriorityStatus;
  }

  const result = await transitionOperatorPriorityStatus({ priorityId, nextStatus });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true as const });
}
