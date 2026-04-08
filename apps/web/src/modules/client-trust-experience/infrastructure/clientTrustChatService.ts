import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

const SYSTEM = `You are a helpful assistant for property sellers reviewing a disclosure form on LECIPM.
Rules:
- Answer only about what the form sections mean, what the usual process is, and practical next steps inside the app.
- Do NOT give legal advice, tax advice, or investment advice.
- Do NOT speculate about outcomes, court results, or liability.
- Do NOT invent facts about this property; if you lack data, say what the user should verify in the document.
- Keep answers short, plain language, and calm.
- If asked for legal advice, say you cannot provide it and suggest consulting a qualified professional.`;

export async function answerClientTrustQuestion(args: {
  message: string;
  documentSummary: string;
  documentStatus: string;
}): Promise<{ reply: string; source: "openai" | "deterministic" }> {
  const msg = args.message.trim().toLowerCase();
  if (
    msg.includes("should i sue") ||
    msg.includes("is it legal") ||
    msg.includes("tax implication") ||
    msg.includes("lawyer") && msg.includes("replace")
  ) {
    return {
      reply:
        "I cannot give legal or tax advice. For those topics, speak with a qualified professional. I can explain what each part of the form is for or what to do next in the app.",
      source: "deterministic",
    };
  }

  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    if (msg.includes("next") || msg.includes("step")) {
      return {
        reply:
          "Next steps: read each section, use “Explain this” if something is unclear, fix any items flagged as missing, then complete the checklist before signing.",
        source: "deterministic",
      };
    }
    if (msg.includes("mean") || msg.includes("what is")) {
      return {
        reply:
          "Open any section and tap “Explain this” for a plain-language description of that part of the form. That text is based on the form itself, not legal advice.",
        source: "deterministic",
      };
    }
    return {
      reply:
        "I can help with what the form sections mean and the general steps to complete them. For a fuller answer, configure OPENAI_API_KEY for this environment. I still will not give legal advice.",
      source: "deterministic",
    };
  }

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 400,
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Document status: ${args.documentStatus}\nShort context (may be empty): ${args.documentSummary}\n\nUser question: ${args.message}`,
      },
    ],
  });
  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  return {
    reply: text || "I could not generate a reply. Please try rephrasing your question.",
    source: "openai",
  };
}
