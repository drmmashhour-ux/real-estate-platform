import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { templateMinSampleSize } from "@/src/modules/messaging/learning/learningEnv";
import { getLearningRecommendation } from "@/src/modules/messaging/learning/learningEngine";
import { derivedRates, weightedScore } from "@/src/modules/messaging/learning/templatePerformance";

export const dynamic = "force-dynamic";

/** GET — synthesized recommendations + experiment snapshot */
export async function GET() {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const min = templateMinSampleSize();
  const rows = await prisma.growthAiTemplatePerformance.findMany({
    where: { sentCount: { gte: min } },
  });

  const scored = rows
    .map((r) => ({
      ...r,
      score: weightedScore(r),
      rates: derivedRates(r),
    }))
    .sort((a, b) => b.score - a.score);

  const highPerforming = scored.slice(0, 8);
  const lowPerforming = [...scored].sort((a, b) => a.score - b.score).slice(0, 8);

  const byObjection = new Map<string, typeof scored>();
  for (const r of scored) {
    const o = r.detectedObjection || "none";
    const list = byObjection.get(o) ?? [];
    list.push(r);
    byObjection.set(o, list);
  }

  const bestByObjection: { objection: string; templateKey: string; score: number }[] = [];
  for (const [objection, list] of byObjection) {
    const top = list.sort((a, b) => b.score - a.score)[0];
    if (top) bestByObjection.push({ objection, templateKey: top.templateKey, score: top.score });
  }

  const sampleContexts = [
    { stage: "engaged", detectedIntent: "buyer_interest", detectedObjection: "uncertainty", highIntent: false },
    { stage: "closing", detectedIntent: "booking_interest", detectedObjection: "timing", highIntent: true },
  ];

  const engineSamples = await Promise.all(
    sampleContexts.map(async (ctx) => ({
      ctx,
      rec: await getLearningRecommendation(ctx, "buyer_uncertainty"),
    }))
  );

  const experiments = await prisma.growthAiRoutingExperiment.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const learningEnabled = process.env.AI_SELF_LEARNING_ROUTING_ENABLED === "1";
  const experimentsEnabled = process.env.AI_TEMPLATE_EXPERIMENTS_ENABLED === "1";

  const textRecommendations: string[] = [];
  for (const h of highPerforming.slice(0, 3)) {
    textRecommendations.push(
      `Strong: ${h.templateKey} (${h.stage}/${h.detectedIntent}/${h.detectedObjection}/HI=${h.highIntent}) score=${h.score.toFixed(2)} bookedRate=${h.rates.bookedRate.toFixed(2)}`
    );
  }
  for (const l of lowPerforming.filter((x) => x.score < 0).slice(0, 3)) {
    textRecommendations.push(
      `Weak: ${l.templateKey} (${l.stage}) score=${l.score.toFixed(2)} — consider revising copy or routing`
    );
  }

  return Response.json({
    minSampleSize: min,
    flags: { learningEnabled, experimentsEnabled },
    highPerforming,
    lowPerforming,
    bestByObjection,
    engineSamples,
    experiments,
    textRecommendations,
  });
}
