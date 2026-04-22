import { prisma } from "@/lib/db";

export type DistributionResult = {
  ok: boolean;
  provider: "buffer" | "meta" | "manual_export" | "none";
  externalRef?: string | null;
  message?: string;
};

/**
 * Sends post to Buffer when `BUFFER_ACCESS_TOKEN` is set; otherwise queues manual export.
 * TikTok/Instagram Graph require additional app review — bridge via Buffer or CSV export.
 */
export async function distributeMarketingPost(postId: string): Promise<DistributionResult> {
  const post = await prisma.lecipmMarketingHubPost.findUnique({ where: { id: postId } });
  if (!post) return { ok: false, provider: "none", message: "not_found" };

  const token = process.env.BUFFER_ACCESS_TOKEN?.trim();
  const caption = post.captionEdited ?? post.caption;
  const hashtags = (post.hashtagsJson as string[]) ?? [];
  const fullText = `${caption}\n\n${hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`;

  if (!token) {
    await prisma.lecipmMarketingHubPost.update({
      where: { id: postId },
      data: {
        status: "export_queue",
        manualExport: true,
        distributionProvider: "manual_export",
      },
    });
    return {
      ok: true,
      provider: "manual_export",
      message: "No BUFFER_ACCESS_TOKEN — post queued for manual export.",
    };
  }

  try {
    const profileRes = await fetch("https://api.bufferapp.com/1/profiles.json?access_token=" + encodeURIComponent(token));
    if (!profileRes.ok) throw new Error(`buffer_profiles_${profileRes.status}`);
    const profiles = (await profileRes.json()) as { id: string }[];
    const profileId = profiles[0]?.id;
    if (!profileId) throw new Error("buffer_no_profiles");

    const body = new URLSearchParams({
      access_token: token,
      profile_ids: JSON.stringify([profileId]),
      text: fullText.slice(0, 2000),
      shorten: "false",
    });

    const upd = await fetch("https://api.bufferapp.com/1/updates/create.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!upd.ok) throw new Error(`buffer_create_${upd.status}`);
    const json = (await upd.json()) as { success?: boolean; updates?: { id?: string }[] };
    const ref = json.updates?.[0]?.id ?? null;

    await prisma.lecipmMarketingHubPost.update({
      where: { id: postId },
      data: {
        status: "scheduled",
        distributionProvider: "buffer",
        externalRef: ref,
        scheduledAt: post.scheduledAt ?? new Date(),
      },
    });

    return { ok: true, provider: "buffer", externalRef: ref };
  } catch (e: unknown) {
    await prisma.lecipmMarketingHubPost.update({
      where: { id: postId },
      data: {
        status: "export_queue",
        manualExport: true,
        distributionProvider: "manual_export",
      },
    });
    return {
      ok: false,
      provider: "manual_export",
      message: e instanceof Error ? e.message : "buffer_failed",
    };
  }
}
