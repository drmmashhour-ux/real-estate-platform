import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { selectBestProperties } from "@/src/modules/ai-selection-engine/application/selectBestProperties";

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ items: [] });
  const withExplanation = new URL(req.url).searchParams.get("explain") === "1";
  const items = await selectBestProperties(userId, withExplanation);
  return NextResponse.json({ items });
}
