import type { DailyContentPlan } from "@/src/modules/ai-growth-engine/domain/growth.types";
import { createItem, saveContentPlan } from "@/src/modules/ai-growth-engine/infrastructure/growthRepository";

/** Saves plan JSON and creates one draft item per slot (payload holds multi-platform targets). */
export async function persistGeneratedPlan(plan: DailyContentPlan) {
  const row = await saveContentPlan(plan);
  const items = [];
  for (const slot of plan.slots) {
    const primary = slot.platforms[0] ?? "linkedin";
    const item = await createItem({
      planId: row.id,
      platform: primary,
      contentType: slot.contentType,
      payloadJson: {
        slot,
        allPlatforms: slot.platforms,
        topic: slot.topic,
        hooks: slot.hooks,
      },
    });
    items.push(item);
  }
  return { planRow: row, items };
}
