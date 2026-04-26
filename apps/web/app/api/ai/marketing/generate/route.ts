import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  generateListingDescriptionStub,
  generateMarketingFromTemplate,
  listMarketingTemplateKeys,
} from "@/lib/ai/marketing-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/marketing/generate — authenticated brokers/admins; stores AiMarketingContent.
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mode = typeof body.mode === "string" ? body.mode : "template";

  if (mode === "template") {
    const templateKey = typeof body.templateKey === "string" ? body.templateKey : "";
    const variables =
      typeof body.variables === "object" && body.variables ? (body.variables as Record<string, string>) : {};
    try {
      const out = await generateMarketingFromTemplate({
        templateKey,
        variables,
        createdById: userId,
      });
      return Response.json({ ...out, engine: "rule_template_v1" });
    } catch (e) {
      return Response.json(
        { error: e instanceof Error ? e.message : "Failed", templates: listMarketingTemplateKeys() },
        { status: 400 }
      );
    }
  }

  if (mode === "listing_description") {
    const title = String(body.title ?? "").slice(0, 200);
    const city = String(body.city ?? "").slice(0, 120);
    const beds = Number(body.beds) || 1;
    const baths = Number(body.baths) || 1;
    const priceHint = body.priceHint != null ? String(body.priceHint).slice(0, 80) : undefined;
    const highlights = Array.isArray(body.highlights) ? body.highlights.map(String).slice(0, 6) : [];
    const bodyText = generateListingDescriptionStub({ title, city, beds, baths, priceHint, highlights });
    const row = await prisma.aiMarketingContent.create({
      data: {
        createdById: userId,
        contentType: "listing_description",
        templateKey: "listing_stub_v1",
        title: title || "Listing description",
        body: bodyText,
        metadata: { engine: "rule_stub_v1" },
      },
    });
    return Response.json({ id: row.id, body: bodyText, engine: "rule_stub_v1" });
  }

  return Response.json({ error: "Unknown mode", modes: ["template", "listing_description"] }, { status: 400 });
}
