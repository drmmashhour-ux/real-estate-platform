import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { prisma } from "@/lib/db";
import { CeoCommandService } from "@/modules/ceo/ceo-command.service";

export async function GET(req: Request) {
  return withDomainProtection({
    domain: "PLATFORM",
    action: "VIEW_ANALYTICS",
    handler: async (userId) => {
      const snapshot = await prisma.ceoSnapshot.findFirst({
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ ok: true, snapshot });
    }
  });
}
