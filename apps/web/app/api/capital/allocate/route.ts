import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { CapitalAllocatorService } from "@/modules/capital-ai/capital-allocator.service";
import { AllocationStrategyMode } from "@/modules/capital-ai/capital-allocator.types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const totalCapital = parseFloat(searchParams.get("totalCapital") || "1000000");
  const strategyMode = (searchParams.get("strategyMode") as AllocationStrategyMode) || "BALANCED";

  return withDomainProtection({
    domain: "FINANCIAL",
    action: "VIEW_ANALYTICS",
    handler: async (userId) => {
      try {
        const plan = await CapitalAllocatorService.getRecommendedAllocation({
          totalCapital,
          strategyMode,
          userId,
        });

        return NextResponse.json({
          ok: true,
          plan,
        });
      } catch (error: any) {
        return NextResponse.json({
          ok: false,
          error: error.message || "Failed to generate allocation plan",
        }, { status: 500 });
      }
    }
  });
}
