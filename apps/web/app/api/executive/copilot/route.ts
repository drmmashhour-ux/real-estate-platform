import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { EXECUTIVE_DATA_SCOPE_LABELS, assertExecutiveAiNarrativeSafe } from "@/lib/executive/safety";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const MODEL = process.env.EXECUTIVE_COMMAND_CENTER_AI_MODEL?.trim() || "gpt-4o-mini";

export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = await req.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }

  await recordAuditEvent({
    actorUserId: admin.userId,
    action: "COMMAND_CENTER_COPILOT_ASKED",
    payload: { questionLength: question.length },
  });

  const snapshotId = typeof body.snapshotId === "string" ? body.snapshotId : null;
  const snapshot = snapshotId
    ? await prisma.executiveSnapshot.findUnique({ where: { id: snapshotId } })
    : await prisma.executiveSnapshot.findFirst({
        where: { ownerType: "admin", ownerId: "platform" },
        orderBy: { snapshotDate: "desc" },
      });

  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    return NextResponse.json({
      success: true,
      answer:
        "AI is not configured in this environment. Use the snapshot metrics and quick actions; all guidance remains human-reviewed and advisory only.",
      scopeLabels: [...EXECUTIVE_DATA_SCOPE_LABELS],
    });
  }

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    max_tokens: 900,
    messages: [
      {
        role: "system",
        content:
          "You are an executive copilot for LECIPM. Answer concisely. Use ONLY the snapshot JSON when present; if missing fields, say so. Advisory only — never describe or promise autonomous execution of trades, tax filing, trust releases, listings, or regulated steps.",
      },
      {
        role: "user",
        content: `QUESTION:\n${question}\n\nLATEST_SNAPSHOT:\n${JSON.stringify(snapshot ?? null, null, 2)}`,
      },
    ],
  });

  const answer = completion.choices[0]?.message?.content?.trim() ?? "";
  try {
    assertExecutiveAiNarrativeSafe(answer, "copilot.answer");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg }, { status: 422 });
  }

  return NextResponse.json({
    success: true,
    answer,
    scopeLabels: [...EXECUTIVE_DATA_SCOPE_LABELS],
  });
}
