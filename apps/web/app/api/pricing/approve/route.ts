import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** POST `{ id }` — approve a nightly suggestion row (requires listing owner). */
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

  const existing = await prisma.bnhubPricingSuggestion.findFirst({
    where: { id, listing: { ownerId: userId } },
    select: { id: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status === "applied") {
    return NextResponse.json({ error: "Already applied" }, { status: 400 });
  }

  const suggestion = await prisma.bnhubPricingSuggestion.update({
    where: { id },
    data: { status: "approved" },
  });

  return NextResponse.json(suggestion);
}
