import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { getManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";
import { decisionModeForAutopilot } from "@/lib/ai/permissions";
import { executeSafeManagerAction } from "@/lib/ai/actions/safe-execute";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  actionKey: z.string().min(1),
  targetEntityType: z.string().min(1),
  targetEntityId: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
  allowManualSafe: z.boolean().optional(),
});

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await getManagerAiPlatformSettings();
  const decisionMode = decisionModeForAutopilot(settings.globalMode);

  const out = await executeSafeManagerAction({
    userId,
    decisionMode,
    body: parsed.data,
    allowManualSafe: parsed.data.allowManualSafe === true,
  });

  if (!out.ok) {
    return NextResponse.json({ error: out.error ?? "execute_failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, result: out.result });
}
