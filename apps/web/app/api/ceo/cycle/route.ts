import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { CeoScheduler } from "@/modules/ceo-ai/ceo-scheduler";

export async function POST(req: Request) {
  return withDomainProtection({
    domain: "PLATFORM",
    action: "GENERATE_ALLOCATION", // Using as proxy for strategic generation
    handler: async (userId) => {
      // Trigger cycle manually (ignores cooldown if forced)
      await CeoScheduler.runCycle();
      return NextResponse.json({ ok: true, message: "CEO cycle triggered." });
    }
  });
}
