import { NextResponse } from "next/server";
import { z } from "zod";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import {
  classifyResponseKind,
  evaluateEscalation,
  leciSafeRulesPreamble,
  type LeciEscalationContext,
  type LeciResponseKind,
} from "@/modules/leci/escalationEngine";

export const dynamic = "force-dynamic";

const MODEL = process.env.LECI_AI_MODEL?.trim() || "gpt-4o-mini";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(8000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).max(28),
  context: z
    .object({
      pathname: z.string().max(512).optional(),
      sectionHint: z.string().max(800).optional(),
      role: z.string().max(64).optional(),
      isDemo: z.boolean().optional(),
      draftSummary: z.string().max(2000).optional(),
      focusTopic: z.string().max(200).optional(),
      complianceState: z.string().max(64).optional(),
    })
    .optional(),
});

function fallbackAnswer(userText: string, context: z.infer<typeof bodySchema>["context"]): string {
  const t = userText.toLowerCase();
  const isFr = /[àâçéèêëîïôùûüÿœ]|\b(qu'est|qu’|c'est|déjà|garantie)\b/i.test(userText);

  if (/garantie\s+légale|legal warranty|warranty/i.test(t)) {
    return isFr
      ? `La garantie légale (Québec) protège l’acheteur contre des vices cachés importants que le vendeur ne pouvait ignorer, dans certaines limites. Ce n’est pas une garantie « tout risque ».\n\nRisques typiques : exclusion mal comprise, délais, preuve du vice.\n\nÀ confirmer : mandat, inspections, déclarations, et avis d’un professionnel si le dossier est sensible.\n\nJe suis LECI, assistant logiciel — pas un avocat ni un courtier.`
      : `Legal warranty (Québec, simplified): protects buyers against certain hidden defects, within limits — not blanket coverage.\n\nRisks: misunderstood exclusions, timelines, proof.\n\nConfirm with your broker / legal counsel for sensitive cases.\n\nI'm LECI, a software assistant — not a lawyer.`;
  }

  if (/already have tools|déjà mes outils|j'ai déjà|j’ai déjà/i.test(t)) {
    return isFr
      ? `Tu peux répondre : « Parfait — on ne remplace pas ton stack. On ajoute une couche : validation, moins d’erreurs, et pistes de leads quand c’est pertinent. »\n\nJe suis LECI, assistant — ce n’est pas un conseil juridique.`
      : `Try: "We don't replace your stack — we add validation, fewer errors, and lead paths where it fits."\n\nI'm LECI, an assistant — not legal advice.`;
  }

  if (context?.isDemo) {
    return isFr
      ? `Mode démo — enchaîne court : montre l’écran, puis dis : « Le formulaire est guidé ; ici le système signale le risque ; voici le score ; sans validation complète, la signature reste bloquée. » Termine par : « On teste sur un vrai dossier ? »\n\nJe suis LECI, assistant présentation.`
      : `Demo mode — show more than you tell: guided form → risk callout → score → signature gate. Close with a trial on a real file.\n\nI'm LECI, a demo assistant.`;
  }

  return isFr
    ? `Je suis LECI, assistant de rédaction et de conformité sur LECIPM. Je peux expliquer des notions générales, proposer une structure de réponse, ou t’aider à formuler — mais pas de conseil juridique personnalisé.\n\nReformule ta question (clause, risque, prochaine étape, objection), ou configure OPENAI_API_KEY pour des réponses plus riches.`
    : `I'm LECI, LECIPM's drafting & compliance assistant. I can explain general concepts and suggest phrasing — not personalized legal advice.\n\nRephrase your question, or set OPENAI_API_KEY for fuller answers.`;
}

function buildSystemPrompt(
  context: z.infer<typeof bodySchema>["context"],
  extra?: { systemBoost?: string; modeLine: string },
): string {
  const ctxLines: string[] = [
    leciSafeRulesPreamble(),
    "You are LECI, the in-product assistant for LECIPM (Québec real estate tech).",
    extra?.modeLine ?? "",
    "Product flow (always respect it): User/Broker → LECI (assistive 'AI twin') helps with draft + compliance cues + guidance → ⚠ ESCALATION: the human broker / responsible professional (YOU) → final validation and binding decision. LECI never replaces that last step.",
    "When users ask who approves, who is liable, or if something is 'final', explicitly point to the human broker / professional escalation layer.",
    "Identity: always clarify you are a software assistant, not a lawyer or regulator.",
    "Never provide legal advice, definitive legal outcomes, or guaranteed compliance.",
    "Encourage validation with a licensed broker, notary, or lawyer when stakes are high.",
    "Primary audience: Québec brokers and serious buyers/sellers — prefer clear French; mirror the user's language if they write in English.",
    "Capabilities: explain clauses, drafting guidance, suggestions, demo support, objection positioning — never confirm legality or approve contracts.",
    "Do not invent OACIQ rules or cite specific articles unless you are certain; prefer 'verify with your agency / counsel'.",
    "Keep answers concise (max ~220 words) with short bullets when helpful.",
    "If DEMO MODE context is true: prioritize what the presenter should say next and key talking points; stay practical.",
    "If the page context mentions warranty/garantie: explain simply, list typical risks, and what to confirm — still no legal advice.",
  ].filter(Boolean);

  if (extra?.systemBoost) ctxLines.push(extra.systemBoost);

  if (context?.pathname) ctxLines.push(`Current path (URL): ${context.pathname}`);
  if (context?.sectionHint) ctxLines.push(`Section hint: ${context.sectionHint}`);
  if (context?.focusTopic) ctxLines.push(`Focus topic: ${context.focusTopic}`);
  if (context?.draftSummary) ctxLines.push(`Draft summary (non-PII): ${context.draftSummary}`);
  if (context?.role) ctxLines.push(`User role hint: ${context.role}`);
  if (context?.complianceState) ctxLines.push(`Compliance UI state: ${context.complianceState}`);
  if (context?.isDemo) ctxLines.push("DEMO MODE: on — optimize for live demo narration.");

  return ctxLines.join("\n");
}

function brokerVisitorLine(role: string | undefined): string {
  const r = (role ?? "").toLowerCase();
  if (r.includes("broker"))
    return "MODE: broker — prioritize faster drafting, error spotting, and client-facing explanations; still escalate binding legal questions.";
  if (r.includes("buyer") || r.includes("seller") || r.includes("client") || r === "user")
    return "MODE: buyer/seller — simple language, reduce confusion, safer next steps; escalate signing/validity questions.";
  return "MODE: general visitor — neutral educational tone; escalate legal finality questions.";
}

export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return NextResponse.json({ error: "No user message" }, { status: 400 });
  }

  const [actorUserId, hubRole] = await Promise.all([getGuestId(), getUserRole()]);
  const effectiveRole = body.context?.role?.trim() || hubRole || undefined;

  const escalationCtx: LeciEscalationContext = {
    userMessage: lastUser.content,
    pathname: body.context?.pathname,
    sectionHint: body.context?.sectionHint,
    focusTopic: body.context?.focusTopic,
    draftSummary: body.context?.draftSummary,
    userRole: effectiveRole,
    complianceState: body.context?.complianceState,
  };

  const escalation = evaluateEscalation(escalationCtx);

  if (escalation.escalate) {
    await recordAuditEvent({
      actorUserId,
      action: "LECI_ESCALATION",
      payload: {
        reasons: escalation.reasons,
        path: body.context?.pathname ?? null,
        qLen: lastUser.content.length,
      },
    });
    return NextResponse.json({
      ok: true,
      source: "escalation" as const,
      answer: escalation.escalationMessage,
      responseKind: "escalation" satisfies LeciResponseKind,
      escalated: true,
    });
  }

  const predictedKind = classifyResponseKind(escalationCtx, {
    forceWarning: Boolean(escalation.systemBoost),
  });

  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    const answer = fallbackAnswer(lastUser.content, body.context);
    await recordAuditEvent({
      actorUserId,
      action: "LECI_CHAT",
      payload: {
        source: "fallback",
        responseKind: predictedKind,
        escalated: false,
        path: body.context?.pathname ?? null,
        qLen: lastUser.content.length,
      },
    });
    return NextResponse.json({
      ok: true,
      source: "fallback" as const,
      answer,
      responseKind: predictedKind,
      escalated: false,
    });
  }

  const system = buildSystemPrompt(
    { ...body.context, role: effectiveRole },
    { systemBoost: escalation.systemBoost, modeLine: brokerVisitorLine(effectiveRole) },
  );
  const trimmed = body.messages.slice(-14).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content.slice(0, 8000),
  }));

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.35,
      max_tokens: 900,
      messages: [{ role: "system", content: system }, ...trimmed],
    });
    const answer = completion.choices[0]?.message?.content?.trim();
    if (!answer) {
      const fb = fallbackAnswer(lastUser.content, body.context);
      await recordAuditEvent({
        actorUserId,
        action: "LECI_CHAT",
        payload: {
          source: "fallback_empty",
          responseKind: predictedKind,
          escalated: false,
          path: body.context?.pathname ?? null,
          qLen: lastUser.content.length,
        },
      });
      return NextResponse.json({
        ok: true,
        source: "fallback" as const,
        answer: fb,
        responseKind: predictedKind,
        escalated: false,
      });
    }
    await recordAuditEvent({
      actorUserId,
      action: "LECI_CHAT",
      payload: {
        source: "openai",
        responseKind: predictedKind,
        escalated: false,
        path: body.context?.pathname ?? null,
        qLen: lastUser.content.length,
      },
    });
    return NextResponse.json({
      ok: true,
      source: "openai" as const,
      answer,
      responseKind: predictedKind,
      escalated: false,
    });
  } catch {
    const fb = fallbackAnswer(lastUser.content, body.context);
    await recordAuditEvent({
      actorUserId,
      action: "LECI_CHAT",
      payload: {
        source: "fallback_error",
        responseKind: predictedKind,
        escalated: false,
        path: body.context?.pathname ?? null,
        qLen: lastUser.content.length,
      },
    });
    return NextResponse.json({
      ok: true,
      source: "fallback" as const,
      answer: fb,
      responseKind: predictedKind,
      escalated: false,
    });
  }
}
