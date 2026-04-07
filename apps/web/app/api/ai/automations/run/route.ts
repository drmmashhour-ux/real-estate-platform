import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";
import { runAllAutomations } from "@/lib/ai/actions/automation-runner";
import type { AutomationRuleKey } from "@/lib/ai/actions/automation-rules";

export const dynamic = "force-dynamic";

const BodyZ = z
  .object({
    keys: z.array(z.string()).optional(),
  })
  .optional();

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getManagerAiPlatformSettings();
  if (settings.globalKillSwitch || !settings.automationsEnabled) {
    return NextResponse.json({ error: "automations_disabled" }, { status: 400 });
  }

  let keys: AutomationRuleKey[] | undefined;
  try {
    const json = await req.json().catch(() => ({}));
    const p = BodyZ.safeParse(json);
    if (p.success && p.data?.keys?.length) {
      keys = p.data.keys as AutomationRuleKey[];
    }
  } catch {
    // all rules
  }

  const results = await runAllAutomations(keys);
  return NextResponse.json({ ok: true, results });
}
