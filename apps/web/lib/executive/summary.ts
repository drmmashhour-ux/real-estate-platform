import { buildExecutivePrompt } from "@/lib/ai/executive";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import {
  assertExecutiveScopeLabels,
  assertExecutiveSummaryPayload,
  EXECUTIVE_DATA_SCOPE_LABELS,
  type ExecutiveSummaryPayload,
} from "@/lib/executive/safety";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const MODEL = process.env.EXECUTIVE_COMMAND_CENTER_AI_MODEL?.trim() || "gpt-4o-mini";

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseExecutiveJson(raw: string): ExecutiveSummaryPayload {
  const cleaned = stripJsonFences(raw);
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  const asStrings = (x: unknown): string[] =>
    Array.isArray(x) ? x.filter((v): v is string => typeof v === "string") : [];

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    topPriorities: asStrings(parsed.topPriorities),
    risks: asStrings(parsed.risks),
    opportunities: asStrings(parsed.opportunities),
    executiveActions: asStrings(parsed.executiveActions),
    dataScopeLabels: asStrings(parsed.dataScopeLabels),
  };
}

function mergeScopeLabels(aiLabels: string[], partial: boolean): string[] {
  const merged = new Set<string>([...EXECUTIVE_DATA_SCOPE_LABELS, ...aiLabels.map((s) => s.trim()).filter(Boolean)]);
  const out = Array.from(merged);
  assertExecutiveScopeLabels(partial, out);
  return out;
}

function buildFallbackSummary(partial: boolean): ExecutiveSummaryPayload {
  const scope = partial
    ? " Some domains have partial coverage; validate against source systems before acting."
    : "";
  return {
    summary: `Executive snapshot loaded. Review platform, compliance, and AI workflow queues in the cockpit; prioritize open high-severity alerts and any reconciliation discrepancies.${scope}`,
    topPriorities: ["Clear critical / high alerts", "Reconcile office discrepancies", "Triage proposed AI workflows"],
    risks: ["Operational load from unresolved alerts", "Compliance backlog if cases age"],
    opportunities: ["Strong deal signals if investment opportunity scores are elevated"],
    executiveActions: ["Refresh snapshot after major data imports", "Assign owners to open compliance cases"],
    dataScopeLabels: [...EXECUTIVE_DATA_SCOPE_LABELS],
  };
}

async function runExecutiveModel(prompt: string): Promise<ExecutiveSummaryPayload> {
  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    throw new Error("OPENAI_NOT_CONFIGURED");
  }

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.35,
    max_tokens: 1800,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You output only valid JSON per the user schema. Advisory executive briefing only — never autonomous execution of regulated, financial, or trust actions.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!raw) throw new Error("EMPTY_EXECUTIVE_AI");
  return parseExecutiveJson(raw);
}

export async function generateExecutiveSummary(snapshotId: string, actorUserId?: string | null) {
  const snapshot = await prisma.executiveSnapshot.findUnique({
    where: { id: snapshotId },
  });

  if (!snapshot) throw new Error("EXECUTIVE_SNAPSHOT_NOT_FOUND");

  const meta = snapshot.metadata as { partialCoverage?: boolean } | null;
  const partialCoverage = Boolean(meta?.partialCoverage);

  const prompt = buildExecutivePrompt({ snapshot, partialCoverage });

  let payload: ExecutiveSummaryPayload;
  try {
    payload = await runExecutiveModel(prompt);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "OPENAI_NOT_CONFIGURED" || msg === "INVALID_EXECUTIVE_AI_JSON" || msg === "EMPTY_EXECUTIVE_AI") {
      payload = buildFallbackSummary(partialCoverage);
    } else {
      throw e;
    }
  }

  payload.dataScopeLabels = mergeScopeLabels(payload.dataScopeLabels, partialCoverage);
  assertExecutiveSummaryPayload(payload);

  const updated = await prisma.executiveSnapshot.update({
    where: { id: snapshot.id },
    data: {
      summary: JSON.stringify(payload),
    },
  });

  await recordAuditEvent({
    actorUserId: actorUserId ?? undefined,
    action: "EXECUTIVE_SUMMARY_GENERATED",
    payload: { snapshotId: updated.id, partialCoverage },
  });

  return updated;
}
