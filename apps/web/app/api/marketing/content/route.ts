import { NextRequest } from "next/server";
import type { MarketingContentStatus, MarketingContentType } from "@prisma/client";
import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { marketingJsonOk } from "@/lib/marketing/http-response";
import { fromPrismaContentType, listContent } from "@/lib/marketing/marketing-content-service";

export const dynamic = "force-dynamic";

function fixType(raw: string | null): MarketingContentType | undefined {
  if (!raw) return undefined;
  const u = raw.trim().toLowerCase();
  if (u === "social_post") return "SOCIAL_POST";
  if (u === "caption") return "CAPTION";
  if (u === "email") return "EMAIL";
  if (u === "growth_idea") return "GROWTH_IDEA";
  return undefined;
}

const STATUS_MAP: Record<string, MarketingContentStatus> = {
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  PUBLISHING: "PUBLISHING",
  FAILED: "FAILED",
  draft: "DRAFT",
  approved: "APPROVED",
  scheduled: "SCHEDULED",
  published: "PUBLISHED",
  publishing: "PUBLISHING",
  failed: "FAILED",
};

function fixStatus(raw: string | null): MarketingContentStatus | undefined {
  if (!raw) return undefined;
  const u = raw.trim();
  return STATUS_MAP[u] ?? STATUS_MAP[u.toUpperCase()];
}

export async function GET(request: NextRequest) {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const type = fixType(searchParams.get("type"));
    const status = fixStatus(searchParams.get("status"));
    const includeVariants = searchParams.get("includeVariants") === "1";

    const rows = await listContent({ type, status, hideVariants: !includeVariants });

    return marketingJsonOk({
      items: rows.map((r) => ({
        id: r.id,
        type: fromPrismaContentType(r.type),
        topic: r.topic,
        tone: r.tone,
        audience: r.audience,
        platform: r.platform,
        theme: r.theme,
        status: r.status,
        scheduledAt: r.scheduledAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        aiSource: r.aiSource,
        preview: r.content.slice(0, 280),
        isEmailCampaign: r.isEmailCampaign,
        emailSubject: r.emailSubject,
        publishChannel: r.publishChannel,
        publishDryRun: r.publishDryRun,
        parentContentId: r.parentContentId,
        isVariant: r.isVariant,
        variantLabel: r.variantLabel,
        isWinnerVariant: r.isWinnerVariant,
      })),
    });
  } catch (e) {
    console.error("[api/marketing/content GET]", e);
    return Response.json({ ok: false, error: "Internal error", code: "INTERNAL" }, { status: 500 });
  }
}
