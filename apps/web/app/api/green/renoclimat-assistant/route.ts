import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import type { RenoclimatChecklistKey } from "@/modules/green-ai/renoclimat-assistant/renoclimat-steps";
import { RENOCLIMAT_CHECKLIST_ORDER } from "@/modules/green-ai/renoclimat-assistant/renoclimat-steps";
import {
  getRenoclimatAssistantState,
  updateRenoclimatAssistantProgress,
} from "@/modules/green-ai/renoclimat-assistant/renoclimat-progress.service";

export const dynamic = "force-dynamic";

function parseChecklistPatch(raw: unknown): Partial<Record<RenoclimatChecklistKey, boolean>> {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Partial<Record<RenoclimatChecklistKey, boolean>> = {};
  for (const key of RENOCLIMAT_CHECKLIST_ORDER) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === "boolean") out[key] = v;
  }
  return out;
}

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state = await getRenoclimatAssistantState(userId);
  return NextResponse.json(state);
}

export async function PATCH(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = ((await req.json()) as Record<string, unknown>) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const checklistRaw = body.checklist;
  const patch =
    checklistRaw !== undefined && checklistRaw !== null
      ? parseChecklistPatch(checklistRaw)
      : parseChecklistPatch(body);

  const remindersEnabled =
    typeof body.remindersEnabled === "boolean" ? body.remindersEnabled : undefined;

  if (Object.keys(patch).length === 0 && remindersEnabled === undefined) {
    return NextResponse.json({ error: "Missing checklist patch or remindersEnabled" }, { status: 400 });
  }

  const state = await updateRenoclimatAssistantProgress({
    userId,
    patch,
    remindersEnabled,
  });

  return NextResponse.json(state);
}
