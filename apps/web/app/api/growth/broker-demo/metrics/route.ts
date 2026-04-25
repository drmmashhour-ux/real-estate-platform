import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  recordBrokerDemoEvent,
  type BrokerDemoMetricAction,
} from "@/modules/growth/broker-demo-metrics.service";

export const dynamic = "force-dynamic";

const ACTIONS: BrokerDemoMetricAction[] = [
  "demo_start",
  "step_view",
  "step_next",
  "step_back",
  "autoplay_on",
  "autoplay_off",
  "drop_or_leave",
  "onboarding_cta",
  "assign_sample_leads",
  "complete_flow",
];

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action.trim() : "";
  if (!ACTIONS.includes(action as BrokerDemoMetricAction)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "BROKER" && user.role !== "ADMIN" && user.role !== "OPERATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await recordBrokerDemoEvent({
      action: action as BrokerDemoMetricAction,
      stepId: typeof body.stepId === "string" ? body.stepId : undefined,
      stepIndex: typeof body.stepIndex === "number" ? body.stepIndex : undefined,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
      userEmail: user.email,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[broker-demo/metrics]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
