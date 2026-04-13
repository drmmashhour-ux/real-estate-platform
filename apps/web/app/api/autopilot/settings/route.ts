import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  getOrCreateListingAutopilotSettings,
  updateListingAutopilotSettings,
} from "@/lib/autopilot/get-autopilot-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const row = await getOrCreateListingAutopilotSettings(userId);
  return NextResponse.json(row);
}

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const allowedKeys = [
    "mode",
    "autoFixTitles",
    "autoFixDescriptions",
    "autoReorderPhotos",
    "autoGenerateContent",
    "allowPriceSuggestions",
  ] as const;
  const data: Partial<Record<(typeof allowedKeys)[number], unknown>> = {};
  for (const k of allowedKeys) {
    if (k in body) data[k] = body[k];
  }

  const row = await updateListingAutopilotSettings(userId, data as Parameters<typeof updateListingAutopilotSettings>[1]);
  return NextResponse.json(row);
}
