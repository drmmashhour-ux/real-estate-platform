import {
  getContentItem,
  updateContentItemStatus,
} from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";
import {
  buildPublishFingerprint,
  validateDraftForPlatform,
} from "@/src/modules/growth-automation/policies/growthAutomationPolicyService";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";

export async function scheduleContent(args: {
  itemId: string;
  scheduledFor: string;
  topic?: string;
}) {
  const item = await getContentItem(args.itemId);
  if (!item) throw new Error("Content item not found");
  if (item.status !== "APPROVED") {
    throw new Error("Only approved items can be scheduled");
  }
  const when = new Date(args.scheduledFor);
  if (Number.isNaN(when.getTime())) throw new Error("Invalid scheduledFor");
  const draft = item.draftPayload as DraftPayload;
  const topic = args.topic ?? item.topic;
  const v = validateDraftForPlatform(item.platform, draft);
  if (!v.ok) throw new Error(v.reason);
  const fingerprint = buildPublishFingerprint(
    item.platform,
    topic,
    when.toISOString().slice(0, 10),
    draft.hook,
  );
  return updateContentItemStatus(args.itemId, {
    status: "SCHEDULED",
    scheduledFor: when,
    publishFingerprint: fingerprint,
  });
}
