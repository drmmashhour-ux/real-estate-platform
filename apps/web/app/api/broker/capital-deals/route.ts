import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { prisma } from "@/lib/db";

export async function GET(_req: Request) {
  return withDomainProtection({
    domain: "BROKERAGE",
    action: "MANAGE_PIPELINE",
    handler: async (userId) => {
      const deals = await prisma.amfCapitalDeal.findMany({
        where: { sponsorUserId: userId },
        include: {
          investmentPacket: true,
          listing: true,
        },
        orderBy: { updatedAt: "desc" },
      });

      const formatted = deals.map(d => ({
        id: d.id,
        title: d.title,
        status: d.status,
        handoffReady: !!d.investmentPacket,
        packetId: d.investmentPacket?.id,
        listingAddress: d.listing?.title || "No address",
        updatedAt: d.updatedAt.toISOString(),
      }));

      return NextResponse.json({ success: true, deals: formatted });
    }
  });
}
