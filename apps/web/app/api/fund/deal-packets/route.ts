import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { prisma } from "@/lib/db";

export async function GET(_req: Request) {
  return withDomainProtection({
    domain: "FINANCIAL",
    action: "VIEW_DEAL_PACKET",
    handler: async (_userId) => {
      const packets = await prisma.dealInvestmentPacket.findMany({
        include: {
          capitalDeal: {
            include: {
              listing: true,
            }
          },
          entity: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, packets });
    }
  });
}
