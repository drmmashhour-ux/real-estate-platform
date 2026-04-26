import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireCronSecretOrAdmin } from "@/lib/server/verify-cron-or-admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const QueryZ = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

/**
 * GET /api/internal/alerts/candidates — recent candidate rows (cron **or** ADMIN only).
 * Does not expose `dedupeKey` (can encode PII patterns).
 */
export async function GET(request: NextRequest) {
  const gate = await requireCronSecretOrAdmin(request);
  if (!gate.ok) return gate.response;

  const q = QueryZ.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  const take = q.success ? (q.data.limit ?? 50) : 50;

  const rows = await prisma.alertCandidate.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      userId: true,
      listingId: true,
      status: true,
      createdAt: true,
    },
  });

  return Response.json({ ok: true, count: rows.length, candidates: rows });
}
