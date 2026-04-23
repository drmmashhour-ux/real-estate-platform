import { requireAdminSession } from "@/lib/admin/require-admin";
import type { MarketingAiStore } from "@/modules/marketing-ai/marketing-ai-storage";
import { replaceServerMarketingAiStore } from "@/modules/marketing-ai/marketing-ai-server-store";
import type { LearningState } from "@/modules/marketing-ai/marketing-ai.types";

export const dynamic = "force-dynamic";

/** POST — mirror browser marketing-ai store for mobile/API (same deployment). */
export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as MarketingAiStore;
    if (!body || typeof body.autonomyLevel !== "string") {
      return Response.json({ error: "invalid_payload" }, { status: 400 });
    }
    replaceServerMarketingAiStore({
      autonomyLevel: body.autonomyLevel,
      weeklyPlan: body.weeklyPlan ?? null,
      queue: Array.isArray(body.queue) ? body.queue : [],
      approvalLogs: Array.isArray(body.approvalLogs) ? body.approvalLogs : [],
      learning: body.learning ?? emptyLearningFallback(),
      alerts: Array.isArray(body.alerts) ? body.alerts : [],
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
}

function emptyLearningFallback(): LearningState {
  return {
    platformScores: {},
    typeScores: {},
    audienceScores: {},
    slotScores: {},
    hookTemplateScores: {},
    samples: 0,
    updatedAtIso: new Date().toISOString(),
  };
}
