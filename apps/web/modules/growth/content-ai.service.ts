/**
 * AI-assisted content generation for growth — templates always work; OpenAI optional when configured.
 */
import { logError, logInfo } from "@/lib/logger";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

const TAG = "[growth.contentAi]";

export type ContentTopic =
  | "broker_productivity"
  | "closing_automation"
  | "esg_benefits"
  | "tenant_verification";

export type ContentFormat = "blog_post" | "linkedin" | "tiktok_script" | "email_campaign";

export type GeneratedContentPack = {
  format: ContentFormat;
  topic: ContentTopic;
  title: string;
  body: string;
  source: "openai" | "template";
};

const TEMPLATES: Record<
  ContentFormat,
  Record<ContentTopic, { title: string; body: string }>
> = {
  blog_post: {
    broker_productivity: {
      title: "5 habits that compound broker productivity (without burning out)",
      body: `## Summary\nIndependent brokers win on focus: batch prospecting, templated follow-ups, and a single deal file.\n\n## Tactics\n- Time-block buyer calls before noon.\n- Centralize listing + transaction context in one workspace.\n- Review pipeline weekly with a simple “stuck deals” list.\n\n## CTA\nSee how LECIPM keeps deals, documents, and AI drafts in one place.`,
    },
    closing_automation: {
      title: "Closing automation: what to automate first (and what never to)",
      body: `## Principles\nAutomate reminders, document assembly, and signature routing — keep negotiation and pricing human.\n\n## Stack\n- Milestone checklist per transaction\n- Immutable document hashes for compliance\n- Signature packets with audit trail\n\n## Outcome\nShorter cycle times and fewer dropped balls between offer and keys.`,
    },
    esg_benefits: {
      title: "ESG in real estate operations: credibility beats buzzwords",
      body: `## Why it matters\nLPs and corporate tenants ask for evidence — not promises.\n\n## What to track\nEnergy benchmarks, retrofit milestones, governance checkpoints.\n\n## Platform angle\nWhen ESG signals sit beside financial milestones, diligence accelerates.`,
    },
    tenant_verification: {
      title: "Tenant verification in Canada: structure beats informal references",
      body: `## Context\nInformal references don’t scale across portfolios.\n\n## Workflow\nCollect applicant identity, run verification, attach score + report to the lease file.\n\n## Risk\nPair outcomes with policy so low scores trigger review — not guesswork.`,
    },
  },
  linkedin: {
    broker_productivity: {
      title: "Hook: productivity",
      body: `Brokers: the bottleneck isn’t leads — it’s context switching.\n\nOne deal file. One timeline. One place for AI drafts you actually approve.\n\n#RealEstate #PropTech #Brokers`,
    },
    closing_automation: {
      title: "Hook: closing",
      body: `Automate the boring parts of closing — not the judgement.\n\nChecklists ✓\nSignatures ✓\nAudit trail ✓\n\nYour clients still hear *you*.\n\n#Closing #RealEstate`,
    },
    esg_benefits: {
      title: "Hook: ESG",
      body: `Investors aren’t asking for slogans — they want milestones next to numbers.\n\nAttach ESG proof points to how you operate deals, not only how you market them.\n\n#ESG #RealEstate`,
    },
    tenant_verification: {
      title: "Hook: screening",
      body: `Tenant screening isn’t “extra paperwork” — it’s fewer surprises at move-in.\n\nStructured verification + lease file = faster landlord confidence.\n\n#Landlord #Rentals`,
    },
  },
  tiktok_script: {
    broker_productivity: {
      title: "15s — productivity",
      body: `[HOOK] POV: you’re a broker with 7 tabs and 3 inboxes.\n[BODY] Stack tools → lose deals. One workspace wins.\n[CTA] Comment “file” for the checklist.`,
    },
    closing_automation: {
      title: "15s — closing",
      body: `[HOOK] Deals die in the gap between “accepted” and “signed.”\n[BODY] Automate packets + reminders; keep negotiation human.\n[CTA] Follow for closing ops tips.`,
    },
    esg_benefits: {
      title: "15s — ESG",
      body: `[HOOK] “We’re sustainable” isn’t diligence.\n[BODY] Show milestones beside financials — investors eat that up.\n[CTA] Save this for your next LP update.`,
    },
    tenant_verification: {
      title: "15s — screening",
      body: `[HOOK] References aren’t underwriting.\n[BODY] Verification attached to the lease file = cleaner portfolios.\n[CTA] Tag a landlord who needs this.`,
    },
  },
  email_campaign: {
    broker_productivity: {
      title: "Campaign: productivity pillar",
      body: `Subject: Cut admin hours this week\n\nHi {{first_name}},\n\nQuick win: batch your follow-ups + keep every deal in one timeline.\n\nLECIPM helps brokers route AI drafts through review so nothing ships without you.\n\n— The LECIPM team`,
    },
    closing_automation: {
      title: "Campaign: closing pillar",
      body: `Subject: Where deals stall (and the fix)\n\nHi {{first_name}},\n\nSignature delays usually aren’t legal — they’re coordination.\n\nAutomate packets and reminders; keep negotiation face-to-face.\n\nBook a walkthrough when you’re ready.`,
    },
    esg_benefits: {
      title: "Campaign: ESG pillar",
      body: `Subject: ESG diligence that fits real workflows\n\nHi {{first_name}},\n\nAttach governance + environmental milestones next to financial events — investors ask fewer repeat questions.\n\nReply “deck” for our outline.`,
    },
    tenant_verification: {
      title: "Campaign: screening pillar",
      body: `Subject: Tenant intake without chaos\n\nHi {{first_name}},\n\nStructured verification beats inbox screenshots.\n\nAttach outcomes to the lease transaction and move faster with confidence.`,
    },
  },
};

async function maybeEnhanceWithOpenAI(input: {
  format: ContentFormat;
  topic: ContentTopic;
  templateBody: string;
}): Promise<string | null> {
  if (!isOpenAiConfigured() || !openai) return null;
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_GROWTH_MODEL?.trim() || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a senior B2B real estate marketing editor. Improve clarity and specificity; keep claims truthful and non-deceptive. No fabricated statistics.",
        },
        {
          role: "user",
          content: `Rewrite for format=${input.format}, topic=${input.topic}. Keep structure readable. Under 900 words.\n\n---\n${input.templateBody}`,
        },
      ],
      max_tokens: 1200,
    });
    const text = completion.choices[0]?.message?.content?.trim();
    return text || null;
  } catch (e) {
    logError(`${TAG}.openai`, { error: e });
    return null;
  }
}

export async function generateGrowthContent(input: {
  format: ContentFormat;
  topic: ContentTopic;
  useOpenAi?: boolean;
}): Promise<GeneratedContentPack> {
  const base = TEMPLATES[input.format][input.topic];
  let body = base.body;
  let source: "openai" | "template" = "template";

  if (input.useOpenAi !== false) {
    const enhanced = await maybeEnhanceWithOpenAI({
      format: input.format,
      topic: input.topic,
      templateBody: base.body,
    });
    if (enhanced) {
      body = enhanced;
      source = "openai";
    }
  }

  logInfo(TAG, { format: input.format, topic: input.topic, source });
  return {
    format: input.format,
    topic: input.topic,
    title: base.title,
    body,
    source,
  };
}
