import { executeActions } from "@/lib/ai/executor";
import {
  type AutonomousAgentListing,
  runAutonomousAgent,
} from "@/lib/ai/orchestrator";
import { isDemoMode } from "@/lib/demo/isDemoMode";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { logApi } from "@/lib/observability/structured-log";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIpFromRequest } from "@/lib/security/ip-fingerprint";

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
  const ip = getClientIpFromRequest(req);
  const rl = checkRateLimit(`ai-orchestrator:${ip}`, { windowMs: 60_000, max: 24 });
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "content-type": "application/json", ...getRateLimitHeaders(rl) },
    });
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch (e) {
    logError(e, { route: "/api/ai/orchestrator", phase: "parse_json" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!body?.id || typeof body.id !== "string" || !body.id.trim()) {
    return Response.json({ error: "listing.id is required" }, { status: 400 });
  }

  try {
    const { execute, ...listing } = body;
    if (isDemoMode) {
      return Response.json({ actions: [], executed: false, demo: true });
    }
    logApi("orchestrate", { listingId: listing.id, execute: Boolean(execute) });
    const actions = await runAutonomousAgent(listing);

    if (execute === true) {
      const st =
        typeof listing.shortTermListingId === "string" && listing.shortTermListingId.trim()
          ? listing.shortTermListingId.trim()
          : undefined;
      const r = await executeActions(actions, {
        marketplaceListingId: listing.id,
        crmListingId:
          typeof listing.crmListingId === "string" && listing.crmListingId.trim()
            ? listing.crmListingId.trim()
            : undefined,
        shortTermListingId: st,
        requireConversionAbWin: true,
      });
      return Response.json({ actions, executeResult: r, executed: r === "ok" });
    }

    return Response.json({ actions, executed: false });
  } catch (e) {
    logError(e, { route: "/api/ai/orchestrator" });
    return Response.json({ error: "Autonomous run failed" }, { status: 500 });
  }
}
