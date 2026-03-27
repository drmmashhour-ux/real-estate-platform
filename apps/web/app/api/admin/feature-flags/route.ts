import { NextRequest } from "next/server";
import { getAllFeatureFlags, setFeatureFlag } from "@/lib/operational-controls";

export const dynamic = "force-dynamic";

/** GET: list all feature flags. */
export async function GET() {
  try {
    const flags = await getAllFeatureFlags();
    return Response.json(flags);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get feature flags" }, { status: 500 });
  }
}

/** POST: create or update a feature flag (admin). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const key = body?.key;
    const enabled = body?.enabled === true;
    if (!key || typeof key !== "string") {
      return Response.json({ error: "key required" }, { status: 400 });
    }
    const flag = await setFeatureFlag(key, enabled, {
      scope: body.scope,
      scopeValue: body.scopeValue,
      reason: body.reason,
      updatedBy: body.updatedBy,
    });
    return Response.json(flag);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to set feature flag" }, { status: 500 });
  }
}
