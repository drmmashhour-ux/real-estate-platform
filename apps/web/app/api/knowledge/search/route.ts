import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { searchKnowledge } from "@/src/modules/knowledge/retrieval/knowledgeRetrievalService";

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const url = new URL(req.url);
  const query = String(url.searchParams.get("query") ?? "").trim();
  const type = url.searchParams.get("type") as "law" | "drafting" | "internal" | null;
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });
  const results = await searchKnowledge(query, { type: type ?? undefined, limit: 8 });
  return NextResponse.json({ results });
}
