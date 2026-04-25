/**
 * Google Gemini (Generative Language API) — optional; used for mortgage expert writing tools.
 * Set GEMINI_API_KEY. Model defaults to gemini-2.0-flash (override with GEMINI_MODEL).
 */

function modelEndpoint(model: string): string {
  const m = model.trim() || "gemini-2.0-flash";
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function geminiGenerateText(
  userPrompt: string,
  opts?: { system?: string }
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return { ok: false, error: "Gemini is not configured (GEMINI_API_KEY)." };
  }
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: userPrompt }] }],
  };
  if (opts?.system?.trim()) {
    body.systemInstruction = { parts: [{ text: opts.system.trim() }] };
  }

  try {
    const res = await fetch(`${modelEndpoint(model)}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    if (!res.ok) {
      return { ok: false, error: `Gemini request failed (${res.status}).` };
    }
    const json = JSON.parse(raw) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };
    if (json.error?.message) {
      return { ok: false, error: json.error.message };
    }
    const text =
      json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("")?.trim() ?? "";
    if (!text) {
      return { ok: false, error: "Empty response from model." };
    }
    return { ok: true, text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
