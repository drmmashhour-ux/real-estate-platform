import { NextRequest } from "next/server";
import { parseSearchIntent } from "@/lib/ai/search-intent";

export const dynamic = "force-dynamic";

/** POST /api/ai/search/intent — public OK (no user data stored). */
export async function POST(request: NextRequest) {
  let body: { q?: string; context?: "sale" | "nightly_stay" };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const q = typeof body.q === "string" ? body.q : "";
  if (!q.trim()) return Response.json({ error: "q required" }, { status: 400 });
  const ctx = body.context === "nightly_stay" ? "nightly_stay" : "sale";
  const result = parseSearchIntent(q, ctx);
  return Response.json(result);
}
