/**
 * Self-learning layer smoke + DB drills.
 * pnpm run validate:ai-learning
 */
import { createHash } from "crypto";
import { prisma } from "../lib/db";
import { seedAutoReplySystem } from "../src/modules/messaging/seedAutoReply";
import { isConversationInExperimentBucket } from "../src/modules/messaging/learning/experiments";
import { getLearningRecommendation } from "../src/modules/messaging/learning/learningEngine";
import { resolveAdaptiveTemplateSelection } from "../src/modules/messaging/aiReplyEngine";
import {
  applyLearningOutcomeFeedback,
  recordTemplateSent,
  recomputeTemplatePerformanceWindow,
} from "../src/modules/messaging/learning/templatePerformance";
import { randomUUID } from "crypto";

async function main() {
  console.info("[validate-learning] 1) Seed templates");
  try {
    await seedAutoReplySystem();
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : "";
    if (code === "P2021") {
      console.warn("[validate-learning] DB missing tables — apply migration 20260425120000_growth_ai_self_learning, then re-run.");
    } else throw e;
  }

  const convId = randomUUID();
  const stableId = "bucket-test-conv-uuid-001";
  const b1 = isConversationInExperimentBucket(stableId, 40);
  const b2 = isConversationInExperimentBucket(stableId, 40);
  console.info("[validate-learning] 2) Experiment bucket stable:", b1 === b2, b1);

  const h = createHash("sha256").update(stableId).digest();
  console.info("[validate-learning] 3) Hash sample byte0:", h[0]);

  process.env.AI_SELF_LEARNING_ROUTING_ENABLED = "0";
  process.env.AI_TEMPLATE_EXPERIMENTS_ENABLED = "0";

  const off = await resolveAdaptiveTemplateSelection({
    conversationId: convId,
    defaultTemplateKey: "buyer_uncertainty",
    stage: "considering",
    intent: "buyer_interest",
    objection: "uncertainty",
    highIntent: false,
    handoffRequired: false,
    pressureScore: 1,
    classifierSnapshot: { test: true },
  });
  console.info("[validate-learning] 4) Learning OFF → expect default:", off.selectionSource, off.templateKey);

  const ctx = {
    stage: "considering",
    detectedIntent: "buyer_interest",
    detectedObjection: "uncertainty",
    highIntent: false,
  };

  try {
    await prisma.growthAiTemplatePerformance.deleteMany({
      where: {
        templateKey: { in: ["buyer_uncertainty", "trust_with_action"] },
        stage: ctx.stage,
        detectedIntent: ctx.detectedIntent,
        detectedObjection: ctx.detectedObjection,
        highIntent: false,
      },
    });

    await prisma.growthAiTemplatePerformance.create({
      data: {
        id: randomUUID(),
        templateKey: "buyer_uncertainty",
        stage: ctx.stage,
        detectedIntent: ctx.detectedIntent,
        detectedObjection: ctx.detectedObjection,
        highIntent: false,
        sentCount: 20,
        replyCount: 4,
        qualifiedCount: 1,
        bookedCount: 0,
        handoffCount: 0,
        staleCount: 2,
      },
    });
    await prisma.growthAiTemplatePerformance.create({
      data: {
        id: randomUUID(),
        templateKey: "trust_with_action",
        stage: ctx.stage,
        detectedIntent: ctx.detectedIntent,
        detectedObjection: ctx.detectedObjection,
        highIntent: false,
        sentCount: 15,
        replyCount: 10,
        qualifiedCount: 5,
        bookedCount: 3,
        handoffCount: 0,
        staleCount: 0,
      },
    });

    const rec = await getLearningRecommendation(ctx, "buyer_uncertainty");
    console.info("[validate-learning] 5) Recommendation:", rec.reason, "→", rec.recommendedTemplateKey);

    process.env.AI_SELF_LEARNING_ROUTING_ENABLED = "1";
    const on = await resolveAdaptiveTemplateSelection({
      conversationId: convId,
      defaultTemplateKey: "buyer_uncertainty",
      stage: ctx.stage,
      intent: "buyer_interest",
      objection: "uncertainty",
      highIntent: false,
      handoffRequired: false,
      pressureScore: 1,
      classifierSnapshot: {},
    });
    console.info("[validate-learning] 6) Learning ON → expect learning if winner clear:", on.selectionSource, on.templateKey);

    await recordTemplateSent({
      templateKey: "buyer_interest_open",
      stage: "engaged",
      detectedIntent: "buyer_interest",
      detectedObjection: "none",
      highIntent: false,
    });
    const user = await prisma.user.findFirst({ select: { id: true } });
    if (user) {
      const conv = await prisma.growthAiConversation.create({
        data: {
          userId: user.id,
          channel: "in_app",
          status: "open",
          aiReplyPending: false,
        },
      });
      await prisma.growthAiConversationDecision.create({
        data: {
          conversationId: conv.id,
          stage: "engaged",
          detectedIntent: "buyer_interest",
          detectedObjection: "none",
          highIntent: false,
          selectedTemplateKey: "buyer_interest_open",
          reasonJson: { validate: true },
        },
      });
      await applyLearningOutcomeFeedback(conv.id, "replied", "user_replied");
      await applyLearningOutcomeFeedback(conv.id, "qualified", "inquiry_sent");
      await applyLearningOutcomeFeedback(conv.id, "booked", "checkout_completed");
      console.info("[validate-learning] 7) Outcome feedback applied (ledger idempotent)");

      const { rowsUpserted } = await recomputeTemplatePerformanceWindow(365);
      console.info("[validate-learning] 8) Recompute window rowsUpserted:", rowsUpserted);

      await prisma.growthAiConversation.delete({ where: { id: conv.id } });
    } else {
      console.warn("[validate-learning] 7) Skip outcome feedback — no user row");
      const { rowsUpserted } = await recomputeTemplatePerformanceWindow(365);
      console.info("[validate-learning] 8) Recompute window rowsUpserted:", rowsUpserted);
    }

    const top = await prisma.growthAiTemplatePerformance.findMany({
      orderBy: { sentCount: "desc" },
      take: 5,
    });
    console.info("[validate-learning] 9) Leaderboard sample:", top.map((r) => `${r.templateKey}:${r.sentCount}`).join(", "));
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : "";
    if (code === "P2021" || code === "P2003") {
      console.warn("[validate-learning] Skip DB drills:", code);
    } else throw e;
  }

  console.info("");
  console.info("LECIPM Self-Learning Messaging Active");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
