import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import type { PlatformRole } from "@prisma/client";
import { assertCapitalAccess } from "@/modules/legal-documents/legal-documents-access";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const spv = await prisma.amfSpv.findUnique({
    where: { id },
    include: {
      exemptDistributionFiles: { orderBy: { distributionDate: "desc" }, take: 20 },
      investorCapitalCommitments: { include: { investor: { select: { id: true, name: true, email: true } } } },
      capitalDeal: {
        select: {
          id: true,
          title: true,
          allowsPublicMarketing: true,
          solicitationMode: true,
          sponsorUserId: true,
        },
      },
    },
  });
  if (!spv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await assertCapitalAccess(spv.capitalDealId, userId, user.role as PlatformRole);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ spv });
}
