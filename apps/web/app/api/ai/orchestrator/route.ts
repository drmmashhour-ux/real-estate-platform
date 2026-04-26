import { executeActions } from "@/lib/ai/executor";
import {
  type AutonomousAgentListing,
  runAutonomousAgent,
} from "@/lib/ai/orchestrator";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

type PostBody = AutonomousAgentListing & {
  /** When true, runs {@link executeActions} (writes to DB). Default false. */
  execute?: boolean;
};

/**
 * Autonomous run: quality + (optional) BNHub pricing + OACIQ compliance.
 * Set `execute: true` to apply `price_update` and compliance blocks (use with care).
 */
export async function POST(req: Request) {
  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch (e) {
    logError(e, { route: "/api/ai/orchestrator", phase: "parse_json" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.id || typeof body.id !== "string") {
    return Response.json({ error: "listing.id is required" }, { status: 400 });
  }

  try {
    const { execute, ...listing } = body;
    const actions = await runAutonomousAgent(listing);

    if (execute === true) {
      const st =
        typeof listing.shortTermListingId === "string" && listing.shortTermListingId.trim()
          ? listing.shortTermListingId.trim()
          : undefined;
      await executeActions(actions, {
        marketplaceListingId: listing.id,
        crmListingId:
          typeof listing.crmListingId === "string" && listing.crmListingId.trim()
            ? listing.crmListingId.trim()
            : undefined,
        shortTermListingId: st,
      });
    }

    return Response.json({ actions, executed: execute === true });
  } catch (e) {
    logError(e, { route: "/api/ai/orchestrator" });
    return Response.json({ error: "Autonomous run failed" }, { status: 500 });
  }
}
