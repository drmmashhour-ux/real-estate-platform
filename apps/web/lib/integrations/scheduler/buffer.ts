/**
 * Buffer — official REST API (legacy v1) for scheduled posts.
 * @see https://buffer.com/developers/api
 *
 * Uses access token from env (BUFFER_ACCESS_TOKEN) or from SocialAccount (platform=buffer).
 */

import { prisma } from "@/lib/db";
import { decryptAccessToken } from "@/lib/content-automation/social-accounts";

export type BufferScheduleInput = {
  caption: string;
  mediaUrl: string;
  scheduledAt: Date;
  /** Buffer profile ids (from /profiles) */
  profileIds: string[];
  accessToken: string;
};

export type BufferScheduleResult =
  | { ok: true; externalId?: string; raw?: unknown }
  | { ok: false; error: string };

const BUFFER_API = "https://api.bufferapp.com/1";

export async function scheduleBufferUpdate(input: BufferScheduleInput): Promise<BufferScheduleResult> {
  try {
    const params = new URLSearchParams();
    params.set("access_token", input.accessToken);
    params.set("text", input.caption.slice(0, 4000));
    params.set("shorten", "false");
    params.set("scheduled_at", String(Math.floor(input.scheduledAt.getTime() / 1000)));
    for (const id of input.profileIds) {
      params.append("profile_ids[]", id);
    }
    if (input.mediaUrl) {
      params.set("media[link]", input.mediaUrl);
    }

    const res = await fetch(`${BUFFER_API}/updates/create.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const raw = await res.json();
    if (!res.ok || (raw as { success?: boolean }).success === false) {
      const msg =
        (raw as { message?: string }).message ??
        (raw as { error?: string }).error ??
        `Buffer ${res.status}`;
      return { ok: false, error: msg };
    }
    const id =
      (raw as { id?: string }).id ??
      (raw as { updates?: { id?: string }[] }).updates?.[0]?.id ??
      undefined;
    return { ok: true, externalId: id, raw };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Buffer request failed" };
  }
}

export async function resolveBufferCredentials(userId: string): Promise<{
  accessToken: string;
  profileIds: string[];
} | null> {
  const row = await prisma.socialAccount.findFirst({
    where: { userId, platform: "buffer" },
    orderBy: { updatedAt: "desc" },
  });
  const token =
    (row && decryptAccessToken(row)) ?? process.env.BUFFER_ACCESS_TOKEN?.trim() ?? null;
  if (!token) return null;

  const meta = (row?.metadataJson as Record<string, unknown>) ?? {};
  const rawProfiles = meta.bufferProfileIds ?? meta.profileIds;
  let profileIds: string[] = [];
  if (Array.isArray(rawProfiles)) {
    profileIds = rawProfiles.map(String);
  } else if (typeof rawProfiles === "string") {
    profileIds = rawProfiles.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (!profileIds.length) {
    const envIds = process.env.BUFFER_PROFILE_IDS?.trim();
    if (envIds) profileIds = envIds.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (!profileIds.length) return null;
  return { accessToken: token, profileIds };
}
