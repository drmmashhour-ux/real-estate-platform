import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { applyPricingSuggestion } from "@/modules/pricing/pricing-apply.service";

export const dynamic = "force-dynamic";

/** POST `{ id }` — apply an **approved** suggestion to published `nightPriceCents` (requires listing owner). */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let id = "";
  try {
    const body = (await req.json()) as { id?: string };
    id = typeof body.id === "string" ? body.id.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const result = await applyPricingSuggestion(id, { actor: "host_ui", userId });

  if (!result.ok && result.message === "Forbidden") {
    return NextResponse.json({ error: result.message }, { status: 403 });
  }

  return NextResponse.json({
    success: result.ok,
    message: result.message ?? null,
  });
}
