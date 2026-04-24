import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { prisma } from "@/lib/db";

export async function GET(_req: Request) {
  return withDomainProtection({
    domain: "FINANCIAL",
    action: "VIEW_ANALYTICS", // Reusing standard action for summary
    handler: async (userId) => {
      // 1. Fetch FINANCIAL entity summary
      const fundEntity = await prisma.lecipmLegalEntity.findFirst({
        where: { 
          OR: [
            { type: "FINANCIAL" },
            { type: "FUND" }
          ],
          userRoles: { some: { userId } } 
        },
        include: { managedSpvs: { include: { capitalDeal: true } } }
      });

      if (!fundEntity) {
        return NextResponse.json({ 
          simulation: true,
          message: "No active FINANCIAL entity found. Operating in global SIMULATION mode." 
        });
      }

      const activeDealsCount = fundEntity.managedSpvs.length;
      const totalAllocated = fundEntity.managedSpvs.reduce((acc, curr) => acc + curr.capitalDeal?.totalCapitalRaised || 0, 0);

      return NextResponse.json({
        entityId: fundEntity.id,
        name: fundEntity.name,
        activeDealsCount,
        totalAllocated,
        simulation: fundEntity.regulator !== "AMF",
      });
    }
  });
}
