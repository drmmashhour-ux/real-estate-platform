import { z } from "zod";
import { generateAdCopy } from "@/lib/marketing/adCopyEngine";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  audience: z.enum(["buyer", "seller", "host", "broker"]),
  city: z.string().max(80).optional(),
});

/**
 * POST /api/marketing/ad-copy — ad copy ideas (TikTok / Meta / Google starters).
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    logError(e, { route: "/api/marketing/ad-copy", phase: "parse_json" });
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  return Response.json(generateAdCopy(parsed.data));
}
