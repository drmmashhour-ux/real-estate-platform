import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { TRIAL_TASK_KEYS } from "@/src/modules/hiring/constants";
import { assignTrialTask } from "@/src/modules/hiring/pipeline";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const taskKey = (body as { taskKey?: string }).taskKey ?? "";
  if (!(TRIAL_TASK_KEYS as readonly string[]).includes(taskKey)) {
    return Response.json({ error: "taskKey must be contact_leads or close_one_user" }, { status: 400 });
  }

  try {
    const row = await assignTrialTask(id, taskKey as "contact_leads" | "close_one_user");
    return Response.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "assign failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
