import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not set", reply: null },
      { status: 503 }
    );
  }

  const openai = new OpenAI({ apiKey });

  let message: string;
  try {
    const body = await req.json();
    message = typeof body.message === "string" ? body.message : "";
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const res = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: message }],
  });

  return Response.json({ reply: res.choices[0].message.content });
}
