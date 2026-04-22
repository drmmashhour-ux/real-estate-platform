import { NextRequest } from "next/server";
import { embedText } from "@/lib/ai/vector-search";
import { isInternalEngineAuthorized } from "@/lib/server/internal-engine-auth";

export const dynamic = "force-dynamic";

/** POST `{ text }` → `{ embedding: number[] }`. Protected when `INTERNAL_API_SECRET` / `CRON_SECRET` is set. */
export async function POST(req: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (secret && !isInternalEngineAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof (body as { text?: unknown }).text === "string" ? (body as { text: string }).text : "";
  if (!text.trim()) {
    return Response.json({ error: "text required" }, { status: 400 });
  }

  const embedding = await embedText(text);
  return Response.json({ embedding });
}
