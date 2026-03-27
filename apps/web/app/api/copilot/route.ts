import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { FeatureNotAvailableError, requireFeature } from "@/lib/featureGate";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { runCopilot } from "@/modules/copilot/application/runCopilot";
import { copilotPostBodySchema } from "@/modules/copilot/api/copilotSchemas";
import { maybeEnrichResponseWithSummary } from "@/modules/copilot/infrastructure/responseBuilder";
import { buildRetrievalAugmentedResponse } from "@/modules/copilot/infrastructure/retrievalAugmentedResponseBuilder";
import { storeFeedbackSignal } from "@/modules/ai-training/application/storeFeedbackSignal";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(req);
    if (user instanceof NextResponse) return user;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = copilotPostBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    if (process.env.COPILOT_SKIP_BILLING_GATE !== "true") {
      try {
        await requireFeature({
          userId: user.id,
          workspaceId: parsed.data.workspaceId ?? undefined,
          feature: "copilot",
        });
      } catch (e) {
        if (e instanceof FeatureNotAvailableError) {
          return NextResponse.json(
            { error: "Subscription required for Copilot. Upgrade to unlock.", code: "feature_required" },
            { status: 403 }
          );
        }
        throw e;
      }
    }

    const role =
      (await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } }))?.role ?? "USER";

    const result = await runCopilot({
      userId: user.id,
      userRole: role,
      query: parsed.data.query,
      workspaceId: parsed.data.workspaceId ?? null,
      conversationId: parsed.data.conversationId ?? null,
      listingId: parsed.data.listingId ?? null,
      watchlistId: parsed.data.watchlistId ?? null,
    });

    if (!result.ok) {
      const status =
        result.code === "unauthorized"
          ? 401
          : result.code === "forbidden"
            ? 403
            : result.code === "not_found"
              ? 404
              : result.code === "disabled"
                ? 503
                : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    let response = result.response;
    if (process.env.COPILOT_USE_RESPONSES_API === "true") {
      response = await maybeEnrichResponseWithSummary(response, parsed.data.query);
    }

    const rag = await buildRetrievalAugmentedResponse({
      query: parsed.data.query,
      userId: user.id,
      workspaceId: parsed.data.workspaceId ?? null,
      listingId: parsed.data.listingId ?? null,
      city: undefined,
      intent: response.intent,
    });
    response = {
      ...response,
      summary: rag.summary,
      data: {
        ...(response.data ?? {}),
        grounded: true,
        deterministic: rag.deterministic,
        retrievedKnowledge: rag.retrievedKnowledge.slice(0, 6),
      },
    };

    captureServerEvent(user.id, AnalyticsEvents.COPILOT_REQUEST, {
      intent: response.intent,
      conversationId: result.conversationId ?? null,
    });

    await storeFeedbackSignal(prisma, {
      subsystem: "copilot",
      entityType: "conversation",
      entityId: result.conversationId ?? "standalone",
      userId: user.id,
      promptOrQuery: parsed.data.query,
      outputSummary: response.summary,
      metadata: { intent: response.intent, grounded: true },
    }).catch(() => {});

    return NextResponse.json({
      response,
      ...(result.conversationId !== undefined && { conversationId: result.conversationId }),
    });
  } catch (error) {
    console.error("Copilot route error:", error);
    return NextResponse.json({ error: "Unable to process copilot request" }, { status: 500 });
  }
}
