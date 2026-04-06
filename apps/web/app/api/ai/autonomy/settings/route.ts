import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { AUTOPILOT_MODES, normalizeAutonomyMode, type AutopilotMode } from "@/lib/ai/types";
import { getManagerAiPlatformSettings, updateManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";

export const dynamic = "force-dynamic";

const ModeZ = z.enum(AUTOPILOT_MODES as unknown as [string, ...string[]]);

const PatchZ = z.object({
  globalMode: ModeZ.optional(),
  automationsEnabled: z.boolean().optional(),
  agentModesJson: z.record(z.string(), ModeZ).optional(),
  notifyOnApproval: z.boolean().optional(),
  globalKillSwitch: z.boolean().optional(),
  domainKillSwitchesJson: z.record(z.string(), z.boolean()).nullable().optional(),
  autonomyPausedUntil: z.string().datetime().nullable().optional(),
});

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const s = await getManagerAiPlatformSettings();
  return NextResponse.json(s);
}

export async function PATCH(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const p = PatchZ.safeParse(json);
  if (!p.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const agentModesJson = p.data.agentModesJson
    ? (Object.fromEntries(
        Object.entries(p.data.agentModesJson).map(([k, v]) => [k, normalizeAutonomyMode(v)])
      ) as Record<string, AutopilotMode>)
    : undefined;

  await updateManagerAiPlatformSettings({
    globalMode: p.data.globalMode != null ? normalizeAutonomyMode(p.data.globalMode) : undefined,
    automationsEnabled: p.data.automationsEnabled,
    agentModesJson,
    notifyOnApproval: p.data.notifyOnApproval,
    globalKillSwitch: p.data.globalKillSwitch,
    domainKillSwitchesJson: p.data.domainKillSwitchesJson ?? undefined,
    autonomyPausedUntil:
      p.data.autonomyPausedUntil === undefined
        ? undefined
        : p.data.autonomyPausedUntil
          ? new Date(p.data.autonomyPausedUntil)
          : null,
  });
  const s = await getManagerAiPlatformSettings();
  return NextResponse.json(s);
}
