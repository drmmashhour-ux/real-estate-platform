import { NextResponse } from "next/server";
import { z } from "zod";
import { AutopilotMode } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { aiAutopilotV1Flags } from "@/config/feature-flags";
import { getPolicy, upsertPolicy } from "@/modules/ai-autopilot";

export const dynamic = "force-dynamic";

const patchBody = z.object({
  scopeType: z.string().min(1).max(32),
  scopeId: z.string().max(64).optional(),
  mode: z.nativeEnum(AutopilotMode),
  allowedDomains: z.array(z.unknown()).optional(),
  blockedActions: z.array(z.unknown()).optional(),
});

/** GET — policy for scope (defaults to ASSIST if missing). */
export async function GET(req: Request) {
  if (!aiAutopilotV1Flags.aiAutopilotV1) {
    return NextResponse.json({ error: "AI Autopilot v1 is disabled" }, { status: 403 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const url = new URL(req.url);
  const scopeType = url.searchParams.get("scopeType")?.trim() || "user";
  const scopeId = url.searchParams.get("scopeId")?.trim() ?? userId;
  const row = await getPolicy(scopeType, scopeId);
  return NextResponse.json({ policy: row, defaultMode: "ASSIST" satisfies AutopilotMode });
}

/** PATCH — update policy for a scope (user can only update own `user` scope unless admin — v1: own scope only). */
export async function PATCH(req: Request) {
  if (!aiAutopilotV1Flags.aiAutopilotV1) {
    return NextResponse.json({ error: "AI Autopilot v1 is disabled" }, { status: 403 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const scopeId = parsed.data.scopeId ?? (parsed.data.scopeType === "user" ? userId : "");
  if (parsed.data.scopeType === "user" && scopeId !== userId) {
    return NextResponse.json({ error: "Cannot change another user's policy" }, { status: 403 });
  }

  const row = await upsertPolicy({
    scopeType: parsed.data.scopeType,
    scopeId,
    mode: parsed.data.mode,
    allowedDomains: parsed.data.allowedDomains,
    blockedActions: parsed.data.blockedActions,
  });
  return NextResponse.json({ policy: row });
}
