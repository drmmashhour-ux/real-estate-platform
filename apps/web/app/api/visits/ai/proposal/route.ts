import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { generateVisitProposalMessage } from "@/lib/visits/ai-visit-messages";
import type { VisitSlot } from "@/lib/visits/get-available-slots";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingTitle = typeof body.listingTitle === "string" ? body.listingTitle : "Property";
  const slots = Array.isArray(body.slots) ? (body.slots as VisitSlot[]) : [];

  const { text, aiGenerated } = await generateVisitProposalMessage({ listingTitle, slots });
  return NextResponse.json({ text, aiGenerated });
}
