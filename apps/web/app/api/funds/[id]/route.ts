import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { FundService } from "@/modules/fund/fund.service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withDomainProtection({
    domain: "FINANCIAL",
    action: "VIEW_ANALYTICS",
    handler: async (userId) => {
      const fund = await FundService.getFund(id);
      if (!fund) return NextResponse.json({ error: "Fund not found" }, { status: 404 });
      
      // Basic access check: admin or investor
      const isInvestor = fund.investors.some(i => i.userId === userId);
      const { prisma } = await import("@/lib/db");
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      const isAdmin = user?.role === "ADMIN";

      if (!isAdmin && !isInvestor) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      return NextResponse.json({ ok: true, fund });
    }
  });
}
