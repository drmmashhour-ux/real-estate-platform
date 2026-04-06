import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST — persist a BNHub search query for personalization & funnels.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    query?: unknown;
    filters?: unknown;
    anonymousId?: unknown;
  };

  const q = typeof body.query === "string" ? body.query.trim().slice(0, 2000) : "";
  if (!q) {
    return Response.json({ error: "query required" }, { status: 400 });
  }

  const user = await getMobileAuthUser(request);
  const anonymousId =
    typeof body.anonymousId === "string" ? body.anonymousId.trim().slice(0, 64) : null;

  if (!user && !anonymousId) {
    return Response.json({ error: "Sign in or pass anonymousId" }, { status: 400 });
  }

  await prisma.bnhubClientSearchEvent.create({
    data: {
      userId: user?.id ?? null,
      anonymousId,
      query: q,
      filtersJson: body.filters && typeof body.filters === "object" ? body.filters : undefined,
    },
  });

  return Response.json({ ok: true });
}
