/**
 * Smoke test: templates, objection routing, optional send (dry unless SEND=1).
 * pnpm run validate:messaging-system
 */
process.env.MESSAGING_AUTOMATION_ENABLED = "1";

import { prisma } from "../lib/db";
import { seedMessagingTemplatesIfEmpty } from "../src/modules/messaging/seedTemplates";
import { resolveObjectionTemplateType } from "../src/modules/messaging/objections";
import { sendObjectionReplyEmail } from "../src/services/messaging";
import { onMessagingTriggerSignup } from "../src/modules/messaging/triggers";
import { processMessagingFollowUps } from "../src/workers/messageWorker";

async function main() {
  let dbReady = false;
  try {
    const r = await seedMessagingTemplatesIfEmpty();
    console.info("[messaging] templates sync:", { created: r.created, updated: r.updated });
    dbReady = true;
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code?: string }).code : "";
    if (code === "P2021") {
      console.warn(
        "[messaging] DB tables missing — apply prisma/migrations/20260328120000_growth_messaging_templates/migration.sql (or migrate deploy), then re-run."
      );
    } else throw e;
  }

  console.info("[messaging] objection 'expensive' ->", resolveObjectionTemplateType("It's too expensive"));
  console.info("[messaging] objection 'safe' ->", resolveObjectionTemplateType("Is this trusted?"));
  console.info("[messaging] objection 'think' ->", resolveObjectionTemplateType("I need to think about it"));
  console.info("[messaging] objection 'assist' ->", resolveObjectionTemplateType("Can you help me do it together?"));

  const user = await prisma.user.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true, name: true } });
  if (!user) {
    console.warn("[messaging] no user — skip send tests");
    console.info("LECIPM Messaging System Active");
    return;
  }

  if (process.env.SEND === "1" && dbReady && (await prisma.messageTemplate.count()) > 0) {
    await onMessagingTriggerSignup(user.id);
    const vars = { name: user.name ?? "there", city: "Montreal" };
    const obj = await sendObjectionReplyEmail(user.id, "the price is too high", vars);
    console.info("[messaging] objection send:", obj);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        growthFollowUpDueAt: new Date(Date.now() - 60_000),
        growthFollowUpSentAt: null,
        growthMessagingPaused: false,
        growthOutreachSegment: "warm",
      },
    });
    const w = await processMessagingFollowUps(5);
    console.info("[messaging] worker:", w);
  } else if (process.env.SEND === "1" && !dbReady) {
    console.warn("[messaging] SEND=1 skipped — database tables not ready");
  } else {
    console.info("[messaging] set SEND=1 to run live Resend + worker (optional)");
  }

  console.info("LECIPM Messaging System Active");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
