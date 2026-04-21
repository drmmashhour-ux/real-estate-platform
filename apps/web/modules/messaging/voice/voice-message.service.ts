import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { scanBufferBeforeStorage } from "@/lib/security/malware-scan";
import {
  MAX_VOICE_BYTES,
  MAX_VOICE_DURATION_SEC,
  VOICE_ALLOWED_MIME,
  type VoiceMessagePayload,
} from "@/modules/messaging/voice/voice.types";
import { logMessagingInfo } from "@/modules/messaging/messaging-logger";

export type SaveVoiceClipInput = {
  conversationId: string;
  senderUserId: string;
  buffer: Buffer;
  mimeType: string;
  durationSec?: number;
};

export type SaveVoiceClipResult =
  | { ok: true; publicUrl: string; payload: VoiceMessagePayload }
  | { ok: false; status: number; error: string };

function extFromMime(mime: string): string {
  const base = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (base === "audio/webm") return "webm";
  if (base === "audio/ogg") return "ogg";
  if (base === "audio/mp4" || base === "audio/m4a") return "m4a";
  if (base === "audio/mpeg") return "mp3";
  if (base === "audio/wav") return "wav";
  return "webm";
}

export function validateVoiceUpload(params: {
  byteLength: number;
  mimeType: string;
  durationSec?: number;
}): { ok: true } | { ok: false; error: string; status: number } {
  if (params.byteLength > MAX_VOICE_BYTES) {
    return { ok: false, error: `Audio too large (max ${Math.round(MAX_VOICE_BYTES / 1e6)}MB)`, status: 400 };
  }
  const mime = params.mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  const allowed =
    VOICE_ALLOWED_MIME.has(params.mimeType) ||
    VOICE_ALLOWED_MIME.has(mime) ||
    mime === "audio/webm" ||
    mime === "audio/ogg";
  if (!allowed) {
    return { ok: false, error: "Unsupported audio format", status: 400 };
  }
  if (params.durationSec != null && params.durationSec > MAX_VOICE_DURATION_SEC + 5) {
    return { ok: false, error: `Clip too long (max ${MAX_VOICE_DURATION_SEC}s)`, status: 400 };
  }
  return { ok: true };
}

/**
 * Persist under `public/uploads/messaging-voice/...` and return URL path + metadata payload.
 */
export async function saveVoiceClip(input: SaveVoiceClipInput): Promise<SaveVoiceClipResult> {
  const v = validateVoiceUpload({
    byteLength: input.buffer.length,
    mimeType: input.mimeType,
    durationSec: input.durationSec,
  });
  if (!v.ok) return { ok: false, status: v.status, error: v.error };

  const scan = await scanBufferBeforeStorage({
    bytes: input.buffer,
    mimeType: input.mimeType.split(";")[0]?.trim() ?? "audio/webm",
    context: "messaging_voice",
  });
  if (!scan.ok) {
    return { ok: false, status: scan.status ?? 422, error: scan.userMessage };
  }

  const ext = extFromMime(input.mimeType);
  const fileId = randomUUID();
  const relativeDir = path.join("uploads", "messaging-voice", input.conversationId);
  const fileName = `${fileId}.${ext}`;
  const relativeUrl = `/${relativeDir.replace(/\\/g, "/")}/${fileName}`;
  const fsDir = path.join(process.cwd(), "public", relativeDir);
  const fsPath = path.join(fsDir, fileName);

  await mkdir(fsDir, { recursive: true });
  await writeFile(fsPath, input.buffer);

  const payload: VoiceMessagePayload = {
    type: "VOICE",
    audioUrl: relativeUrl,
    durationSec: input.durationSec,
    mimeType: input.mimeType.split(";")[0]?.trim(),
  };

  logMessagingInfo("voice.saved", {
    conversationId: input.conversationId,
    bytes: input.buffer.length,
  });

  return { ok: true, publicUrl: relativeUrl, payload };
}
