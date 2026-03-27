import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertAdminResponse } from "@/lib/admin/assert-admin";

export const dynamic = "force-dynamic";

/** Top referrers by referral row count + optional HOST invite breakdown. */
export async function GET() {
  const err = await assertAdminResponse();
  if (err) return err;

  const grouped = await prisma.referral.groupBy({
    by: ["referrerId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 25,
  });

  const ids = grouped.map((g) => g.referrerId);
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true, name: true, referralCode: true },
  });
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));

  const hostCounts = await prisma.referral.groupBy({
    by: ["referrerId"],
    where: { inviteKind: "HOST" },
    _count: { id: true },
  });
  const hostByReferrer = Object.fromEntries(hostCounts.map((h) => [h.referrerId, h._count.id]));

  const rows = grouped.map((g) => {
    const u = byId[g.referrerId];
    return {
      referrerId: g.referrerId,
      email: u?.email ?? null,
      name: u?.name ?? null,
      referralCode: u?.referralCode ?? null,
      totalReferrals: g._count.id,
      hostInvites: hostByReferrer[g.referrerId] ?? 0,
    };
  });

  return NextResponse.json({ rows });
}
