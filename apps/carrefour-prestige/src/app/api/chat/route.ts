import { CARREFOUR_CHAT_SYSTEM_PROMPT } from "@/lib/ai/chat-system-prompt";
import { CHAT_MODEL, getOpenAI } from "@/lib/openai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 }
    );
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: CARREFOUR_CHAT_SYSTEM_PROMPT },
      { role: "user", content: message },
    ],
  });

  return NextResponse.json({
    reply: res.choices[0]?.message?.content ?? "",
  });
}
