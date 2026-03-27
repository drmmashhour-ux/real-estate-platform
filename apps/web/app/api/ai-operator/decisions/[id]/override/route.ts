import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** POST /api/ai-operator/decisions/[id]/override – Human override with notes. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { overrideBy, newAction, notes } = body;
    if (!overrideBy || !newAction) {
      return Response.json(
        { error: "overrideBy and newAction required" },
        { status: 400 }
      );
    }
    const decision = await prisma.aiOperatorDecision.findUnique({
      where: { id },
    });
    if (!decision) {
      return Response.json({ error: "Decision not found" }, { status: 404 });
    }
    const updated = await prisma.aiOperatorDecision.update({
      where: { id },
      data: {
        humanOverrideBy: overrideBy,
        humanOverrideAt: new Date(),
        humanOverrideAction: newAction,
        humanOverrideNotes: notes ?? null,
        outputSummary: {
          ...(typeof decision.outputSummary === "object" && decision.outputSummary !== null
            ? decision.outputSummary as Record<string, unknown>
            : {}),
          overriddenAction: newAction,
          overrideNotes: notes,
        },
      },
    });
    return Response.json(updated);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Override failed" }, { status: 500 });
  }
}
