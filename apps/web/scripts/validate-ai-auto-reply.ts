/**
 * Seed auto-reply templates/rules, classifier smoke, routing samples, optional DB flows.
 * pnpm run validate:ai-auto-reply
 */
process.env.AI_AUTO_REPLY_ENABLED = "1";

import { prisma } from "../lib/db";
import { classifyInbound, detectHighIntent } from "../src/modules/messaging/aiClassifier";
import { generateReply, selectTemplateKeyFromClassification } from "../src/modules/messaging/aiReplyEngine";
import {
  computePressureScore,
  deriveConversationStage,
} from "../src/modules/messaging/growthAiStage";
import { seedAutoReplySystem } from "../src/modules/messaging/seedAutoReply";
import { deriveConversationOutcome, updateGrowthAiOutcome } from "../src/modules/messaging/outcomes";
import { processOneGrowthAiReply, recordGrowthAiUserInbound } from "../src/services/growthAiAutoReply";
import { processSilentNudgeQueue } from "../src/workers/silentNudgeWorker";

const scenarios: Array<{ label: string; text: string }> = [
  { label: "uncertainty", text: "I'm interested but not sure" },
  { label: "price", text: "This looks expensive compared to others" },
  { label: "trust", text: "Is this safe?" },
  { label: "timing", text: "Maybe later" },
  { label: "payment", text: "I was charged twice" },
  { label: "human", text: "Can a broker call me?" },
];

async function main() {
  console.info("[validate] 1) Templates + rules seed (when DB available)");
  console.info("[validate] 2) Classifier samples (no DB)");
  for (const s of scenarios) {
    const c = classifyInbound(s.text, { flowHint: "buyer", priorUserTexts: [] });
    console.info(
      `  ${s.label}: intent=${c.detectedIntent} objection=${c.detectedObjection} handoff=${c.handoffRequired} hi=${c.highIntent} conf=${c.confidence.toFixed(2)}`
    );
  }

  const pay = classifyInbound("My refund hasn't arrived and I was double charged", { flowHint: "buyer" });
  console.info("[validate] 3) Payment → handoff:", pay.handoffRequired, pay.handoffReason);

  const legal = classifyInbound("I will sue you and talk to my lawyer", { flowHint: "buyer" });
  console.info("[validate] 4) Legal threat → handoff:", legal.handoffRequired, legal.handoffReason);

  const loop = classifyInbound("I'm still not sure what to do", {
    flowHint: "buyer",
    priorUserTexts: ["I'm not sure I understand the process"],
  });
  console.info("[validate] 5) Repeated uncertainty:", loop.handoffRequired, loop.handoffReason);

  const hiBook = classifyInbound("Where do I pay and can I book tonight?", {
    flowHint: "booking",
    checkoutStarted: true,
    priorUserTexts: [],
  });
  console.info("[validate] 6) High-intent booking:", hiBook.highIntent, hiBook.detectedIntent);

  const priceOff = classifyInbound("How much exactly for the full stay?", { flowHint: "booking" });
  console.info(
    "[validate] 7) High-intent phrase:",
    priceOff.highIntent,
    detectHighIntent("How much exactly for the full stay?", {})
  );

  console.info("[validate] 8) Outcome derivation:", deriveConversationOutcome(null, "checkout_completed"));

  console.info("[validate] 8b) Stage derivation samples:");
  const sEngaged = deriveConversationStage({
    outcome: "replied",
    userMessageCount: 1,
    highIntent: false,
    lastUserObjection: "none",
  });
  const sConsidering = deriveConversationStage({
    outcome: "replied",
    userMessageCount: 1,
    highIntent: false,
    lastUserObjection: "trust",
  });
  const sHi = deriveConversationStage({
    outcome: "replied",
    userMessageCount: 1,
    highIntent: true,
    lastUserObjection: "none",
  });
  const sClosing = deriveConversationStage({
    outcome: "replied",
    userMessageCount: 2,
    highIntent: true,
    lastUserObjection: "none",
  });
  const sConverted = deriveConversationStage({
    outcome: "booked",
    userMessageCount: 3,
    highIntent: true,
    lastUserObjection: "none",
  });
  console.info(`  interest→engaged: ${sEngaged}`);
  console.info(`  objection→considering: ${sConsidering}`);
  console.info(`  high intent→high_intent: ${sHi}`);
  console.info(`  no conversion msgs≥2+HI→closing: ${sClosing}`);
  console.info(`  booked→converted: ${sConverted}`);
  const pScore = computePressureScore({
    highIntent: true,
    userRepliedAgain: true,
    objectionNotNone: false,
    checkoutStarted: false,
    repeatedUserMessages: false,
  });
  console.info(`[validate] 8c) Pressure score (HI+replied): ${pScore}`);

  let dbReady = false;
  try {
    const seed = await seedAutoReplySystem();
    console.info("[validate] seed counts:", seed);
    dbReady = true;
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : "";
    if (code === "P2021") {
      console.warn(
        "[validate] DB tables missing — apply migrations (growth_ai_conversion_engine, growth_ai_conversion_optimization, 20260425100000_growth_ai_adaptive_stage), then re-run."
      );
    } else throw e;
  }

  if (dbReady) {
    console.info("[validate] 9) Template routing keys (DB):");
    for (const s of scenarios.slice(0, 4)) {
      const c = classifyInbound(s.text, { flowHint: "booking", priorUserTexts: [] });
      const handoff = c.handoffRequired;
      const key = await selectTemplateKeyFromClassification({
        intent: c.detected_intent,
        objection: c.detected_objection,
        highIntent: c.high_intent,
        includePrice: false,
        stage: "engaged",
        pressureScore: 0,
      });
      const r = await generateReply({
        intent: c.detected_intent,
        objection: c.detected_objection,
        handoffRequired: handoff,
        context: { name: "Alex", city: "Montreal", listing_title: "Downtown stay" },
        forcedTemplateKey: handoff ? null : key,
      });
      console.info(`  ${s.label}: routed=${key} sent=${r.template_key} handoff=${r.handoff_required}`);
    }

    process.env.AI_AUTO_REPLY_INCLUDE_PRICE = "1";
    const priceOn = classifyInbound("Too costly vs others", { flowHint: "buyer" });
    const keyPrice = await selectTemplateKeyFromClassification({
      intent: priceOn.detected_intent,
      objection: priceOn.detected_objection,
      highIntent: priceOn.high_intent,
      includePrice: true,
      stage: "considering",
    });
    console.info("[validate] 10) Price w/ AI_AUTO_REPLY_INCLUDE_PRICE=1 route:", keyPrice);
    delete process.env.AI_AUTO_REPLY_INCLUDE_PRICE;

    const priceOffEnv = classifyInbound("Too costly vs others", { flowHint: "buyer" });
    const keyNoPrice = await selectTemplateKeyFromClassification({
      intent: priceOffEnv.detected_intent,
      objection: "uncertainty",
      highIntent: priceOffEnv.high_intent,
      includePrice: false,
      stage: "considering",
    });

    const keyClosing = await selectTemplateKeyFromClassification({
      intent: "booking_interest",
      objection: "none",
      highIntent: true,
      includePrice: false,
      stage: "closing",
      pressureScore: 5,
    });
    console.info("[validate] 11b) Closing-stage route (pressure≥4):", keyClosing);
    console.info("[validate] 11) Price w/o include_price (→ uncertainty path):", keyNoPrice);

    const user = await prisma.user.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true } });
    if (user) {
      const convId = await prisma.$transaction(async (tx) => {
        const c = await tx.growthAiConversation.create({
          data: {
            userId: user.id,
            channel: "in_app",
            status: "open",
            contextJson: { city: "Montreal", listing_title: "Sample condo" } as object,
            aiReplyPending: true,
            outcome: "new",
            lastUserMessageAt: new Date(),
          },
        });
        await tx.growthAiConversationMessage.create({
          data: {
            conversationId: c.id,
            senderType: "user",
            messageText: "I want this place — how do I proceed?",
          },
        });
        return c.id;
      });
      const r1 = await processOneGrowthAiReply(convId);
      console.info("[validate] 12) High-intent process reply:", { convId, ...r1 });
      await prisma.growthAiConversationMessage.create({
        data: {
          conversationId: convId,
          senderType: "user",
          messageText: "Still thinking about timing — any flexibility?",
        },
      });
      await prisma.growthAiConversation.update({
        where: { id: convId },
        data: { aiReplyPending: true, highIntent: true, lastUserMessageAt: new Date() },
      });
      const r2 = await processOneGrowthAiReply(convId);
      const convMid = await prisma.growthAiConversation.findUnique({
        where: { id: convId },
        select: { stage: true },
      });
      console.info("[validate] 12b) Second turn (expect closing push path if eligible):", {
        ...r2,
        stage: convMid?.stage,
      });
      const lastAiAfter2 = await prisma.growthAiConversationMessage.findFirst({
        where: { conversationId: convId, senderType: "ai" },
        orderBy: { createdAt: "desc" },
        select: { templateKey: true },
      });
      if (convMid?.stage === "closing") console.info("[validate] Stage updated: closing");
      if (lastAiAfter2?.templateKey === "closing_push") console.info("[validate] Closing push triggered");
      const psValidate = computePressureScore({
        highIntent: true,
        userRepliedAgain: true,
        objectionNotNone: false,
        checkoutStarted: false,
        repeatedUserMessages: false,
      });
      console.info(`[validate] Pressure score: ${psValidate}`);
      const pushTpl = await prisma.autoReplyTemplate.findUnique({ where: { templateKey: "closing_push" } });
      console.info("[validate] 12c) closing_push template present:", Boolean(pushTpl));

      await updateGrowthAiOutcome(convId, "checkout_completed");
      const o = await prisma.growthAiConversation.findUnique({
        where: { id: convId },
        select: { outcome: true, stage: true },
      });
      console.info(
        "[validate] 13) Outcome updated: booked",
        o?.outcome,
        "stage:",
        o?.stage,
        "(expect converted)"
      );

      const ghost = await prisma.growthAiConversation.create({
        data: {
          userId: user.id,
          channel: "in_app",
          status: "open",
          aiReplyPending: false,
          highIntent: false,
          outcome: "replied",
          lastAutomatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
          lastAiMessageAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
          lastUserMessageAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
        },
      });
      await prisma.growthAiConversationMessage.create({
        data: {
          conversationId: ghost.id,
          senderType: "ai",
          messageText: "Thanks for your interest!",
          templateKey: "buyer_interest_open",
          ctaType: "inquiry",
        },
      });
      const nudgeRes = await processSilentNudgeQueue(5);
      console.info("[validate] 14) Silent nudge queue:", nudgeRes);

      await prisma.growthAiConversation.deleteMany({ where: { id: { in: [ghost.id, convId] } } });

      await recordGrowthAiUserInbound({
        userId: user.id,
        messageText: "Still comparing stays.",
        contextPatch: { flow_hint: "booking" },
      });
      console.info("[validate] 15) recordGrowthAiUserInbound ok");
    } else {
      console.warn("[validate] no user row — skip DB conversation drills");
    }
  }

  console.info("");
  console.info("Sample copy shapes:");
  console.info("  Trust + action: trust_with_action template in DB.");
  console.info("  High-intent: assist_close / next_step_call via selectTemplateKeyFromClassification.");
  console.info("  Nudge: ghosting_follow_up or closing_nudge (closing stage), isNudge=true once.");
  console.info("  Handoff: handoff_ack + outcome handoff + GrowthAiConversationHandoff row.");
  console.info("");
  console.info("LECIPM Adaptive Conversion Engine Active");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
