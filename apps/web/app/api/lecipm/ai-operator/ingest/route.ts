import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";
import { AI_OPERATOR_CONTEXTS } from "@/src/modules/ai-operator/domain/operator.enums";
import type { AiOperatorContext } from "@/src/modules/ai-operator/domain/operator.enums";
import { generateActions } from "@/src/modules/ai-operator/application/generateActions";
import { persistGeneratedActions } from "@/src/modules/ai-operator/infrastructure/aiOperatorRepository";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const context = body?.context as AiOperatorContext;
  const snapshot = body?.snapshot && typeof body.snapshot === "object" ? (body.snapshot as Record<string, unknown>) : {};
  const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId.trim() : "";

  if (!context || !AI_OPERATOR_CONTEXTS.includes(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 });
  }

  if (workspaceId) {
    const auth = await requireWorkspacePermission(prisma, {
      userId,
      workspaceId,
      permission: "access_copilot",
    });
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
  }

  const proposals = generateActions(context, snapshot);
  if (proposals.length === 0) {
    return NextResponse.json({ ok: true, createdIds: [], mode: "manual", proposals: 0 });
  }

  const { createdIds, mode } = await persistGeneratedActions(userId, proposals, {
    workspaceId: workspaceId || undefined,
  });
  return NextResponse.json({ ok: true, createdIds, mode, proposals: proposals.length });
}
