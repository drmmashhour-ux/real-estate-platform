import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegalContext } from "@/src/modules/knowledge/retrieval/legalContextRetrievalService";

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "sign in required" }, { status: 401 });

  const url = new URL(req.url);
  const query = String(url.searchParams.get("query") ?? "").trim();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  const chunkType = url.searchParams.get("chunkType") as "declaration" | "obligation" | "clause" | "process" | null;
  const audience = url.searchParams.get("audience") as "seller" | "buyer" | "broker" | "transaction" | null;
  const importance = url.searchParams.get("importance") as "mandatory" | "optional" | null;
  const documentType = url.searchParams.get("documentType") as "law" | "drafting" | "internal" | null;
  const limit = Number(url.searchParams.get("limit") ?? "8") || 8;

  const chunks = await getLegalContext(query, {
    ...(chunkType ? { chunkType } : {}),
    ...(audience ? { audience } : {}),
    ...(importance ? { importance } : {}),
    ...(documentType ? { documentType } : {}),
    limit,
  });

  return NextResponse.json({
    chunks: chunks.map((c) => ({
      chunkId: c.chunkId,
      content: c.content,
      score: c.score,
      chunkType: c.chunkType,
      audience: c.audience,
      importance: c.importance,
      pageNumber: c.pageNumber,
      source: c.source,
    })),
  });
}
