import { resolveRegisteredLineFromDigest } from "@/lib/demo/narration-digest-server";

export const dynamic = "force-dynamic";

type ProviderName = "openai" | "elevenlabs";

function providerFromEnv(): ProviderName {
  const raw = (process.env.AI_NARRATION_PROVIDER ?? "openai").trim().toLowerCase();
  return raw === "elevenlabs" ? "elevenlabs" : "openai";
}

function mapNeutralOpenAiVoice(voiceEnv: string): string {
  const v = voiceEnv.trim().toLowerCase();
  const allowed = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]);
  if (allowed.has(v)) return v;
  return "alloy";
}

async function synthesizeOpenAi(text: string): Promise<{ base64: string; mimeType: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  const voice = mapNeutralOpenAiVoice(process.env.AI_NARRATION_VOICE ?? "neutral");
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      voice,
      input: text,
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI TTS failed (${res.status}) ${errText.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return { base64: buf.toString("base64"), mimeType: "audio/mpeg" };
}

async function synthesizeElevenLabs(text: string): Promise<{ base64: string; mimeType: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const voiceId =
    process.env.ELEVENLABS_VOICE_ID?.trim() ||
    /** Arabic-capable default only when explicit voice missing — operators should set `ELEVENLABS_VOICE_ID`. */
    "";
  if (!apiKey || !voiceId) {
    throw new Error("ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID are required for elevenlabs provider");
  }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`ElevenLabs TTS failed (${res.status}) ${errText.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return { base64: buf.toString("base64"), mimeType: "audio/mpeg" };
}

export async function POST(req: Request) {
  if (process.env.AI_NARRATION_ENABLED?.trim().toLowerCase() !== "true") {
    return Response.json({ ok: false, message: "AI narration disabled" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const digestHex =
    typeof body === "object" &&
    body !== null &&
    "digest" in body &&
    typeof (body as { digest: unknown }).digest === "string"
      ? (body as { digest: string }).digest.trim().toLowerCase()
      : "";

  if (!digestHex) {
    return Response.json({ ok: false, message: "Body must include digest (sha256 hex)" }, { status: 400 });
  }

  const resolved = resolveRegisteredLineFromDigest(digestHex);
  if (!resolved) {
    return Response.json({ ok: false, message: "Unknown narration digest" }, { status: 403 });
  }

  const { text } = resolved;

  try {
    const provider = providerFromEnv();
    const audio =
      provider === "elevenlabs" ? await synthesizeElevenLabs(text) : await synthesizeOpenAi(text);

    return Response.json({
      ok: true,
      mimeType: audio.mimeType,
      base64: audio.base64,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "TTS failed";
    console.error("[ai-narration]", msg);
    return Response.json({ ok: false, message: msg.slice(0, 400) }, { status: 502 });
  }
}
