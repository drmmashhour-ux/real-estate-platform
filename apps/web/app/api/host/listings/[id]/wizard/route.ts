import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { patchShortTermListingForHost } from "@/lib/host/patch-short-term-listing-for-host";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await patchShortTermListingForHost(userId, id, body);
  if (!result.ok) {
    if (result.status === 403) {
      return Response.json({ error: result.error ?? "Forbidden" }, { status: 403 });
    }
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ listing: result.listing });
}
