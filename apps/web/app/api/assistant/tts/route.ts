import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/assistant/tts
 *
 * Server-side text-to-speech using ElevenLabs when configured,
 * returning audio/mpeg. Falls back to 204 (let client use browser TTS).
 *
 * Body: { text: string; lang?: "en" | "fr" }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 5000) : "";
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim() ?? "";
  const voiceId = process.env.ELEVENLABS_ASSISTANT_VOICE_ID?.trim()
    || process.env.ELEVENLABS_VOICE_ID?.trim()
    || "";
  const modelId = process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_multilingual_v2";

  if (!apiKey || !voiceId) {
    return new NextResponse(null, { status: 204 });
  }

  const voiceSettings = {
    stability: 0.71,
    similarity_boost: 0.80,
    style: 0.35,
    use_speaker_boost: true,
  };

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: voiceSettings,
      }),
    });

    if (!res.ok) {
      console.error(`[tts] ElevenLabs HTTP ${res.status}`);
      return new NextResponse(null, { status: 204 });
    }

    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[tts] ElevenLabs fetch error:", err);
    return new NextResponse(null, { status: 204 });
  }
}
