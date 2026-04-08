import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import {
  buildContactLine,
  getEmailTemplateById,
  mergeTemplate,
  type TemplateVariables,
} from "@/lib/admin/partner-outreach";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

export const dynamic = "force-dynamic";

type Body = {
  templateId?: string;
  vars?: TemplateVariables;
  polishWithAi?: boolean;
  extraContext?: string;
};

/**
 * Admin-only: merge template variables and optionally polish with OpenAI.
 * Does not send email — copy only.
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let reqBody: Body;
  try {
    reqBody = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const template = getEmailTemplateById(String(reqBody.templateId ?? ""));
  if (!template) {
    return Response.json({ error: "Unknown templateId" }, { status: 400 });
  }

  const vars: TemplateVariables = {
    ...(reqBody.vars ?? {}),
    CONTACT_LINE: buildContactLine(String(reqBody.vars?.CONTACT_NAME ?? "")),
  };

  const subject = mergeTemplate(template.subjectTemplate, vars);
  const bodyText = mergeTemplate(template.bodyTemplate, vars);

  const client = openai;
  if (reqBody.polishWithAi && isOpenAiConfigured() && client) {
    try {
      const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.35,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You polish B2B partnership inquiry emails. Rules:
- Do not invent statistics, revenue, user counts, or existing deals.
- Do not add fake company names or signatures.
- Keep the same intent: affiliate/partnership inquiry only.
- Output JSON: {"subject": string, "body": string}`,
          },
          {
            role: "user",
            content: JSON.stringify({
              subject,
              body: bodyText,
              optionalNotes: reqBody.extraContext?.trim() || undefined,
            }),
          },
        ],
      });
      const raw = res.choices[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw) as { subject?: string; body?: string };
        if (typeof parsed.subject === "string" && parsed.subject.trim()) {
          return Response.json({
            subject: parsed.subject.trim(),
            body: typeof parsed.body === "string" ? parsed.body.trim() : bodyText,
            source: "openai",
          });
        }
      }
    } catch {
      /* fall through */
    }
  }

  return Response.json({ subject, body: bodyText, source: "template" });
}
