import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { runFraudChecks } from "@/src/modules/bnhub/application/fraudCheckService";

export const dynamic = "force-dynamic";

async function assertHostOrAdmin(listingId: string, userId: string) {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) return { ok: false as const, status: 404 as const, error: "Listing not found" };
  if (listing.ownerId === userId) return { ok: true as const };
  if (await isPlatformAdmin(userId)) return { ok: true as const };
  return { ok: false as const, status: 403 as const, error: "Forbidden" };
}

/** GET latest fraud checks + aggregate row for a listing. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id: listingId } = await context.params;
  const gate = await assertHostOrAdmin(listingId, userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

  const [checks, aggregate] = await Promise.all([
    prisma.bnhubFraudCheck.findMany({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.propertyFraudScore.findUnique({ where: { listingId } }),
  ]);

  return Response.json({ checks, aggregate });
}

/** POST run fraud checks (writes rows + updates aggregate). */
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id: listingId } = await context.params;
  const gate = await assertHostOrAdmin(listingId, userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

  try {
    const result = await runFraudChecks(listingId);
    return Response.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
