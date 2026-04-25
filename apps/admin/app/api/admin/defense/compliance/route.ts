import { NextRequest } from "next/server";
import {
  getComplianceRequirements,
  upsertComplianceRequirement,
  getComplianceReviewQueue,
  upsertComplianceReview,
} from "@/lib/defense/compliance";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get("marketId");
    const queue = searchParams.get("queue") === "true";
    if (queue) {
      const list = await getComplianceReviewQueue({
        status: searchParams.get("status") ?? undefined,
        marketId: marketId ?? undefined,
        limit: 100,
      });
      return Response.json(list);
    }
    if (marketId) {
      const requirements = await getComplianceRequirements(marketId);
      return Response.json(requirements);
    }
    return Response.json({ error: "marketId required for requirements" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get compliance data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.requirementKey !== undefined) {
      const { marketId, requirementKey, name, description, active } = body;
      if (!marketId || !requirementKey || !name) {
        return Response.json({ error: "marketId, requirementKey, name required" }, { status: 400 });
      }
      const req = await upsertComplianceRequirement({
        marketId,
        requirementKey,
        name,
        description,
        active,
      });
      return Response.json(req);
    }
    const { entityType, entityId, marketId, status, requirementId, reviewedBy, notes, documentRefs } = body;
    if (!entityType || !entityId || !status) {
      return Response.json({ error: "entityType, entityId, status required" }, { status: 400 });
    }
    const review = await upsertComplianceReview({
      entityType,
      entityId,
      marketId,
      status,
      requirementId,
      reviewedBy,
      notes,
      documentRefs,
    });
    return Response.json(review);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to upsert compliance" }, { status: 500 });
  }
}
