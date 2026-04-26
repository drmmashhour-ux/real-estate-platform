import { askAI } from "@/lib/ai/assistant";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { prompt?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  try {
    const response = await askAI(prompt);
    return Response.json({ response });
  } catch (e) {
    console.error("POST /api/ai", e);
    const message = e instanceof Error ? e.message : String(e);
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
