import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { FundService } from "@/modules/fund/fund.service";

export async function GET(req: Request) {
  return withDomainProtection({
    domain: "FINANCIAL",
    action: "VIEW_ANALYTICS",
    handler: async (userId) => {
      // Check if admin (this check should ideally be in a shared helper)
      const { prisma } = await import("@/lib/db");
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      const isAdmin = user?.role === "ADMIN";

      const funds = await FundService.listFunds(userId, isAdmin);
      return NextResponse.json({ ok: true, funds });
    }
  });
}
