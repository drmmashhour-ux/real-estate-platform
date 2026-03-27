import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { selectBestLeads } from "@/src/modules/ai-selection-engine/application/selectBestLeads";

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ items: [] });
  const withExplanation = new URL(req.url).searchParams.get("explain") === "1";
  const items = await selectBestLeads(userId, withExplanation);
  return NextResponse.json({ items });
}
