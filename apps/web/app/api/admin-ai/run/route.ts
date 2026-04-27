import { getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { runDailyAdminAi } from "@/lib/admin-ai/run-daily-admin-ai";
import { flags } from "@/lib/flags";
import { adminAiRunBodySchema } from "@/lib/admin-ai/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!flags.AI_ASSISTANT) {
    return Response.json({ error: "AI assistant disabled", disabled: true }, { status: 403 });
  }
  const role = await getUserRole();
  if (!isHubAdminRole(role)) {
    return Response.json({ error: "Admin required" }, { status: 403 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = adminAiRunBodySchema.safeParse(raw);
  const runType = parsed.success ? parsed.data?.runType ?? "full_daily" : "full_daily";

  const result = await runDailyAdminAi(runType);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  return Response.json({
    ok: true,
    runId: result.runId,
    insightCount: result.insightCount,
  });
}
