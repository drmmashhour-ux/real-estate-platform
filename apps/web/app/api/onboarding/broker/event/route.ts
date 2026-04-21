/**
 * POST — broker LECIPM onboarding progress & activation metrics (LaunchEvent).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { onboardingLog } from "@/modules/sales/sales-logger";

export const dynamic = "force-dynamic";

const STEP_COUNT = 7;

type BrokerOnboardingClientEvent =
  | { kind: "step_complete"; stepIndex: number; payload?: Record<string, unknown> }
  | { kind: "skip_flow"; fromStepIndex: number }
  | { kind: "activation_cta"; cta: "first_listing" | "first_lead" }
  | { kind: "complete"; payload?: Record<string, unknown> };

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object" || !("kind" in raw)) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const body = raw as BrokerOnboardingClientEvent;

  try {
    switch (body.kind) {
      case "step_complete": {
        if (typeof body.stepIndex !== "number" || body.stepIndex < 0 || body.stepIndex >= STEP_COUNT) {
          return NextResponse.json({ error: "Invalid stepIndex" }, { status: 400 });
        }
        await prisma.launchEvent.create({
          data: {
            event: "broker_lecipm_onboarding_step_complete",
            userId,
            payload: {
              stepIndex: body.stepIndex,
              ...(body.payload && typeof body.payload === "object" ? body.payload : {}),
            },
          },
        });
        onboardingLog.info("step_complete", { stepIndex: body.stepIndex });
        break;
      }
      case "skip_flow": {
        if (typeof body.fromStepIndex !== "number") {
          return NextResponse.json({ error: "Invalid fromStepIndex" }, { status: 400 });
        }
        await prisma.launchEvent.create({
          data: {
            event: "broker_lecipm_onboarding_skip",
            userId,
            payload: { fromStepIndex: body.fromStepIndex },
          },
        });
        onboardingLog.info("skip_flow", { fromStepIndex: body.fromStepIndex });
        break;
      }
      case "activation_cta": {
        if (body.cta !== "first_listing" && body.cta !== "first_lead") {
          return NextResponse.json({ error: "Invalid cta" }, { status: 400 });
        }
        const ev =
          body.cta === "first_listing" ? "broker_activation_first_listing_cta" : "broker_activation_first_lead_cta";
        await prisma.launchEvent.create({
          data: {
            event: ev,
            userId,
            payload: { at: new Date().toISOString() },
          },
        });
        onboardingLog.info("activation_cta", { cta: body.cta });
        break;
      }
      case "complete": {
        await prisma.launchEvent.create({
          data: {
            event: "broker_lecipm_onboarding_completed",
            userId,
            payload: {
              completedAt: new Date().toISOString(),
              ...(body.payload && typeof body.payload === "object" ? body.payload : {}),
            },
          },
        });
        onboardingLog.info("completed", {});
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    onboardingLog.error("event_failed", { message: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
