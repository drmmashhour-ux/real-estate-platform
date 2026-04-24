import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { prisma } from "@/lib/db";
import { CeoWeeklyPlanEngine } from "@/modules/ceo/engines/ceo-weekly-plan.engine";

export async function GET(req: Request) {
  return withDomainProtection({
    domain: "PLATFORM",
    action: "VIEW_ANALYTICS",
    handler: async (userId) => {
      const snapshot = await prisma.ceoSnapshot.findFirst({
        orderBy: { createdAt: "desc" }
      });
      if (!snapshot) return NextResponse.json({ ok: false, error: "No snapshot available" });

      const weeklyPlan = await CeoWeeklyPlanEngine.generateWeeklyPlan(snapshot.id);
      return NextResponse.json({ ok: true, weeklyPlan });
    }
  });
}
