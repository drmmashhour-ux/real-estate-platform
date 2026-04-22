import { prisma } from "@/lib/db";

import { buildRenderManifest, normalizeSceneDurations, rankMediaUrls } from "./video-assembly.service";
import type { VideoAspectRatio, VideoDurationTarget, VideoMediaPackageVm, VideoProjectRowVm, VideoScriptVm } from "./video-engine.types";
import { getVideoEnginePerformanceSummary, recordVideoPerformanceEvent } from "./video-performance.service";
import { resolveMediaUrlsForScript } from "./video-media.service";
import {
  generateBNHubVideoScript,
  generateDealOfTheDayVideoScript,
  generateInvestorVideoScript,
  generateListingVideoScript,
  generateLuxuryShowcaseVideoScript,
  generateResidenceVideoScript,
  generateTopFiveAreaVideoScript,
} from "./video-script.service";
import { defaultAspectForScriptPlatform } from "./video-template.service";

function rowVm(r: {
  id: string;
  templateKey: string;
  title: string;
  hookText: string;
  status: string;
  durationTargetSec: number;
  aspectRatio: string;
  targetPlatform: string;
  createdAt: Date;
  scheduledAt: Date | null;
  marketingHubPostId: string | null;
  performanceJson: unknown;
}): VideoProjectRowVm {
  const perf = r.performanceJson && typeof r.performanceJson === "object" ? (r.performanceJson as Record<string, unknown>) : null;
  const impressions = typeof perf?.impressions === "number" ? perf.impressions : 0;
  const clicks = typeof perf?.clicks === "number" ? perf.clicks : 0;
  return {
    id: r.id,
    templateKey: r.templateKey,
    title: r.title,
    hookText: r.hookText,
    status: r.status,
    durationTargetSec: r.durationTargetSec,
    aspectRatio: r.aspectRatio,
    targetPlatform: r.targetPlatform,
    createdAt: r.createdAt.toISOString(),
    scheduledAt: r.scheduledAt?.toISOString() ?? null,
    marketingHubPostId: r.marketingHubPostId,
    impressionsApprox: impressions,
    clicksApprox: clicks,
  };
}

export async function listVideoProjectsByStatus(
  statuses: string[],
  take = 40,
): Promise<VideoProjectRowVm[]> {
  const rows = await prisma.lecipmVideoEngineProject.findMany({
    where: { status: { in: statuses } },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      templateKey: true,
      title: true,
      hookText: true,
      status: true,
      durationTargetSec: true,
      aspectRatio: true,
      targetPlatform: true,
      createdAt: true,
      scheduledAt: true,
      marketingHubPostId: true,
      performanceJson: true,
    },
  });
  return rows.map(rowVm);
}

export async function listTopPerformingVideos(take = 10): Promise<VideoProjectRowVm[]> {
  const rows = await prisma.lecipmVideoEngineProject.findMany({
    where: { status: "published" },
    orderBy: { updatedAt: "desc" },
    take: take * 3,
    select: {
      id: true,
      templateKey: true,
      title: true,
      hookText: true,
      status: true,
      durationTargetSec: true,
      aspectRatio: true,
      targetPlatform: true,
      createdAt: true,
      scheduledAt: true,
      marketingHubPostId: true,
      performanceJson: true,
    },
  });

  const scored = rows
    .map((r) => {
      const p = (r.performanceJson as Record<string, unknown>) ?? {};
      const imp = Number(p.impressions ?? 0);
      const clk = Number(p.clicks ?? 0);
      return { row: r, score: imp * 1 + clk * 3 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map((x) => x.row);

  return scored.map(rowVm);
}

export type GenerateVideoProjectInput =
  | {
      templateKey: "listing_spotlight";
      listingId: string;
      durationTargetSec?: VideoDurationTarget;
      aspectRatio?: VideoAspectRatio;
    }
  | {
      templateKey: "luxury_property_showcase";
      fsboListingId: string;
      durationTargetSec?: VideoDurationTarget;
      aspectRatio?: VideoAspectRatio;
    }
  | {
      templateKey: "bnhub_stay_spotlight";
      stayId: string;
      durationTargetSec?: VideoDurationTarget;
      aspectRatio?: VideoAspectRatio;
    }
  | {
      templateKey: "investor_opportunity_brief";
      opportunityId: string;
      durationTargetSec?: VideoDurationTarget;
      aspectRatio?: VideoAspectRatio;
    }
  | {
      templateKey: "residence_services_highlight";
      residenceId: string;
      durationTargetSec?: VideoDurationTarget;
      aspectRatio?: VideoAspectRatio;
    }
  | {
      templateKey: "deal_of_the_day";
      durationTargetSec?: VideoDurationTarget;
      aspectRatio?: VideoAspectRatio;
    }
  | {
      templateKey: "top_5_listings_area";
      city: string;
      durationTargetSec?: VideoDurationTarget;
      aspectRatio?: VideoAspectRatio;
    };

export async function generateVideoEngineProject(input: GenerateVideoProjectInput): Promise<{ id: string }> {
  const durationTargetSec = input.durationTargetSec ?? 30;

  let script: Awaited<ReturnType<typeof generateListingVideoScript>>;
  switch (input.templateKey) {
    case "listing_spotlight":
      script = await generateListingVideoScript(input.listingId, durationTargetSec);
      break;
    case "luxury_property_showcase":
      script = await generateLuxuryShowcaseVideoScript(input.fsboListingId, durationTargetSec);
      break;
    case "bnhub_stay_spotlight":
      script = await generateBNHubVideoScript(input.stayId, durationTargetSec);
      break;
    case "investor_opportunity_brief":
      script = await generateInvestorVideoScript(input.opportunityId, durationTargetSec);
      break;
    case "residence_services_highlight":
      script = await generateResidenceVideoScript(input.residenceId, durationTargetSec);
      break;
    case "deal_of_the_day": {
      const s = await generateDealOfTheDayVideoScript(durationTargetSec);
      if (!s) throw new Error("No eligible deal for deal_of_the_day");
      script = s;
      break;
    }
    case "top_5_listings_area":
      script = await generateTopFiveAreaVideoScript(input.city, durationTargetSec);
      break;
    default:
      throw new Error("unsupported_template");
  }

  script = normalizeSceneDurations(script);

  const { urls, coverUrl } = await resolveMediaUrlsForScript(script);
  const { ranked, warnings } = rankMediaUrls(urls, coverUrl);
  const mediaPkg: VideoMediaPackageVm = {
    rankedUrls: ranked,
    coverFirst: !!coverUrl,
    warnings,
  };

  const scriptWithWarnings = {
    ...script,
    mediaWarning: [script.mediaWarning, ...warnings].filter(Boolean).join(" ") || null,
  };

  const aspectRatio: VideoAspectRatio = input.aspectRatio ?? defaultAspectForScriptPlatform(script.targetPlatform);

  const manifest = buildRenderManifest(scriptWithWarnings, ranked, aspectRatio);

  const row = await prisma.lecipmVideoEngineProject.create({
    data: {
      templateKey: script.templateKey,
      sourceKind: script.sourceKind,
      sourceId: script.sourceId,
      status: "preview",
      durationTargetSec: script.durationTargetSec,
      aspectRatio,
      targetPlatform: script.targetPlatform,
      title: script.title.slice(0, 512),
      hookText: script.hook,
      cta: script.cta,
      scriptJson: scriptWithWarnings as object,
      renderManifestJson: manifest as object,
      mediaPackageJson: mediaPkg as object,
      performanceJson: {
        funnel: ["script", "manifest", "media_package"],
        landingHints: videoLandingHints(script),
      } as object,
    },
  });

  await recordVideoPerformanceEvent(row.id, "video_created", { templateKey: script.templateKey });
  await recordVideoPerformanceEvent(row.id, "video_preview", { templateKey: script.templateKey });

  return { id: row.id };
}

function videoLandingHints(script: VideoScriptVm): Record<string, string | null> {
  return {
    templateKey: script.templateKey,
    sourceKind: script.sourceKind,
    sourceId: script.sourceId,
    socialPostLink: null,
    landingTarget: null,
  };
}

export async function getVideoEngineVideosAdminPayload() {
  const [performanceSummary, draftQueue, approvedQueue, scheduled, published] = await Promise.all([
    getVideoEnginePerformanceSummary(),
    listVideoProjectsByStatus(["draft", "preview"], 80),
    listVideoProjectsByStatus(["approved"], 40),
    listVideoProjectsByStatus(["scheduled"], 40),
    listVideoProjectsByStatus(["published"], 40),
  ]);

  return {
    performanceSummary,
    draftQueue,
    approvedQueue,
    scheduled,
    published,
  };
}

export async function getVideoProjectBundle(id: string) {
  const row = await prisma.lecipmVideoEngineProject.findUnique({ where: { id } });
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    title: row.title,
    hookText: row.hookText,
    cta: row.cta,
    scriptJson: row.scriptJson,
    renderManifestJson: row.renderManifestJson,
    mediaPackageJson: row.mediaPackageJson,
    marketingHubPostId: row.marketingHubPostId,
    scheduledAt: row.scheduledAt,
    publishedAt: row.publishedAt,
    rejectionReason: row.rejectionReason,
  };
}
