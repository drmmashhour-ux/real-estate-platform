import type { Prisma } from "@prisma/client";
import type { MarketingTypeApi } from "@/lib/marketing/marketing-content-service";
import { createDraft, createVariantDraftGroup } from "@/lib/marketing/marketing-content-service";

export type VariantTextItem = { label: string; text: string; aiSource: string; contentJson?: Prisma.InputJsonValue };

export async function saveTextVariants(params: {
  userId: string | null;
  type: MarketingTypeApi;
  shared: {
    platform?: string | null;
    topic?: string | null;
    tone?: string | null;
    audience?: string | null;
    theme?: string | null;
    contentJson?: Prisma.InputJsonValue;
    isEmailCampaign?: boolean;
  };
  items: VariantTextItem[];
}): Promise<{ parentId: string; contentIds: string[] }> {
  if (params.items.length === 1) {
    const only = params.items[0]!;
    const id = await createDraft({
      userId: params.userId,
      type: params.type,
      content: only.text,
      contentJson: only.contentJson ?? params.shared.contentJson,
      platform: params.shared.platform,
      topic: params.shared.topic,
      tone: params.shared.tone,
      audience: params.shared.audience,
      theme: params.shared.theme,
      aiSource: only.aiSource,
    });
    return { parentId: id, contentIds: [id] };
  }

  const { parentId, allIds } = await createVariantDraftGroup({
    userId: params.userId,
    type: params.type,
    shared: params.shared,
    items: params.items.map((it) => ({
      label: it.label,
      content: it.text,
      aiSource: it.aiSource,
      contentJson: it.contentJson,
    })),
  });
  return { parentId, contentIds: allIds };
}
