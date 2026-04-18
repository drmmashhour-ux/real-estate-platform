/**
 * Growth automation — returns reviewable recommendations only (no auto-send).
 */
import { prisma } from "@/lib/db";
import { findStaleLeadsForBroker } from "@/modules/lead-nurture/reengagement.service";

export type GrowthRecommendation = {
  id: string;
  title: string;
  detail: string;
  severity: "info" | "warning";
};

export async function listGrowthRecommendations(userId: string): Promise<GrowthRecommendation[]> {
  const out: GrowthRecommendation[] = [];
  const stale = await findStaleLeadsForBroker(userId, 14).catch(() => []);
  if (stale.length) {
    out.push({
      id: "stale-leads",
      title: "Stale broker leads need follow-up",
      detail: `${stale.length} leads have not been touched recently — draft follow-ups for review.`,
      severity: "warning",
    });
  }

  let drafts = 0;
  try {
    drafts = await prisma.marketingBlogPost.count({
      where: { userId, status: "DRAFT" },
    });
  } catch {
    drafts = 0;
  }
  if (drafts > 0) {
    out.push({
      id: "blog-drafts",
      title: "Unpublished marketing blog drafts",
      detail: `You have ${drafts} draft post(s). Review and publish when ready.`,
      severity: "info",
    });
  }

  if (out.length === 0) {
    out.push({
      id: "no-blockers",
      title: "No urgent automation signals",
      detail: "Continue monitoring CRM and performance events weekly.",
      severity: "info",
    });
  }
  return out;
}
