import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import { optimizeListing } from "@/lib/ai/optimize";
import { recommendTemplate } from "@/lib/ai/template-recommendation";
import { getManagerInsights } from "@/lib/ai-property-manager";
import { logAiEvent } from "@/lib/ai/log";
import { logError } from "@/lib/logger";
import { getGuestId } from "@/lib/auth/session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { processCrmChatMessage, type CrmChatRequestBody } from "@/lib/immo/process-crm-chat";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { handleLecipmManagerChat } from "@/lib/ai/managed-chat-handler";

export const dynamic = "force-dynamic";

const DEMO_LISTING = {
  title: "Luxury Villa in Montreal",
  description: "Modern property with premium finishes.",
  price: 850000,
  bedrooms: 4,
  bathrooms: 3,
  city: "Montreal",
};

function ruleBasedReply(message: string, listing: Record<string, unknown>): string {
  const m = message.toLowerCase().trim();
  if (/improve|better|optimiz|enhance/i.test(m)) {
    const optimizeInput = {
      title: String(listing.title ?? DEMO_LISTING.title),
      description: String(listing.description ?? DEMO_LISTING.description),
      amenities: Array.isArray(listing.amenities) ? listing.amenities.filter((item): item is string => typeof item === "string") : [],
      location: { city: String(listing.city ?? DEMO_LISTING.city) },
      photos: Array.isArray(listing.photos) ? listing.photos.filter((item): item is string => typeof item === "string") : [],
    };
    const opt = optimizeListing(optimizeInput);
    return `Here are quick improvements: 1) Title: "${opt.optimizedTitle.slice(0, 60)}...". 2) Add a clear CTA to your description. 3) SEO keywords to consider: ${opt.seoKeywords.slice(0, 4).join(", ")}. Use "Optimize Listing" for full output.`;
  }
  if (/price|pricing|set price|how much/i.test(m)) {
    return "Pricing guidance: Research comparable listings in the same area. Consider listing slightly above market if the property has unique features. Use the AI Analytics card to see conversion potential. You can also run an AVM or get a broker price opinion.";
  }
  if (/sell faster|sell quick|quick sale|faster sale/i.test(m)) {
    const managerInput = {
      title: String(listing.title ?? DEMO_LISTING.title),
      description: String(listing.description ?? DEMO_LISTING.description),
      amenities: Array.isArray(listing.amenities) ? listing.amenities.filter((item): item is string => typeof item === "string") : [],
      location: { city: String(listing.city ?? DEMO_LISTING.city) },
      photos: Array.isArray(listing.photos) ? listing.photos.filter((item): item is string => typeof item === "string") : [],
    };
    const mgr = getManagerInsights(managerInput);
    return `To sell faster: ${mgr.recommendedActions.slice(0, 3).join(". ")}. Also ensure your listing has strong photos and a clear call to action. Use "Optimize Listing" and "Generate Marketing" for ready-to-use copy.`;
  }
  if (/template|best template|which template|canva/i.test(m)) {
    const templateInput = {
      title: String(listing.title ?? DEMO_LISTING.title),
      description: String(listing.description ?? DEMO_LISTING.description),
      amenities: Array.isArray(listing.amenities) ? listing.amenities.filter((item): item is string => typeof item === "string") : [],
      location: { city: String(listing.city ?? DEMO_LISTING.city) },
      photos: Array.isArray(listing.photos) ? listing.photos.filter((item): item is string => typeof item === "string") : [],
    };
    const rec = recommendTemplate(templateInput);
    return `Recommended template: ${rec.recommendedTemplateId}. ${rec.reason} Open Design Templates to use it.`;
  }
  if (/hello|hi|hey|help/i.test(m)) {
    return "I can help you improve this listing, suggest a price, recommend a template, or suggest how to sell faster. Try: \"improve this listing\", \"what price should I set?\", \"how can I sell faster?\", or \"best template?\"";
  }
  return "I can help with: improving the listing, pricing guidance, selling faster tips, or template recommendations. Try one of those or ask something specific.";
}

/** ImmoContact / platform CRM chat — stores messages, optional auto-lead. */
async function handleImmoCrmChat(body: Record<string, unknown>) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "anonymous";
  const limit = checkRateLimit(`public:immo-chat:${ip}`, { windowMs: 60_000, max: 40 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many messages. Try again shortly.", reply: "" },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const payload: CrmChatRequestBody = {
    message: typeof body.message === "string" ? body.message : "",
    conversationId: typeof body.conversationId === "string" ? body.conversationId : null,
    guestSessionId: typeof body.guestSessionId === "string" ? body.guestSessionId : null,
    contact:
      body.contact && typeof body.contact === "object"
        ? (body.contact as CrmChatRequestBody["contact"])
        : undefined,
  };

  const userId = await getGuestId();
  try {
    const out = await processCrmChatMessage(payload, userId);
    return NextResponse.json({
      reply: out.reply,
      conversationId: out.conversationId,
      leadCreated: out.leadCreated,
      leadId: out.leadId ?? null,
      intent: out.intent ?? null,
      crm: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN_CONVERSATION") {
      return NextResponse.json({ error: "Forbidden", crm: true }, { status: 403 });
    }
    if (msg === "GUEST_REQUIRED") {
      return NextResponse.json(
        { error: "guestSessionId required for anonymous chat", crm: true },
        { status: 400 }
      );
    }
    throw e;
  }
}

async function handleListingDesignChat(body: Record<string, unknown>) {
  const listingId = body?.listingId;
  const message = body?.message ?? "";
  let listing: Record<string, unknown> = DEMO_LISTING;
  if (listingId) {
    try {
      const res = await fetch(
        `${getPublicAppUrl()}/api/design-studio/payload?id=${encodeURIComponent(String(listingId))}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (data?.title) {
        listing = {
          title: data.title,
          description: data.description ?? DEMO_LISTING.description,
          price: DEMO_LISTING.price,
          bedrooms: DEMO_LISTING.bedrooms,
          bathrooms: DEMO_LISTING.bathrooms,
          city: DEMO_LISTING.city,
        };
      }
    } catch {
      // use demo
    }
  }

  const client = openai;
  if (isOpenAiConfigured() && client) {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful real estate assistant. The user is asking about a listing with the following details: ${JSON.stringify(listing)}. Answer concisely and offer to help with improving the listing, pricing, templates, or selling faster.`,
        },
        {
          role: "user",
          content: String(message),
        },
      ],
    });
    const reply = completion.choices[0]?.message?.content?.trim() ?? ruleBasedReply(String(message), listing);
    logAiEvent("chat_question_asked", { listingId, messageLength: String(message).length, source: "openai" });
    return NextResponse.json({ reply });
  }

  const reply = ruleBasedReply(String(message), listing);
  logAiEvent("chat_question_asked", { listingId, messageLength: String(message).length });
  return NextResponse.json({ reply });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    if (body?.lecipmManager === true || body?.channel === "lecipm_manager") {
      return handleLecipmManagerChat(req, body as Record<string, unknown>);
    }

    const hasCrmConversation =
      typeof body?.conversationId === "string" && body.conversationId.length > 0;
    const useCrm = body?.crm === true || body?.channel === "immo" || hasCrmConversation;

    if (useCrm) {
      return handleImmoCrmChat(body as Record<string, unknown>);
    }

    return handleListingDesignChat(body as Record<string, unknown>);
  } catch (e) {
    logError("POST /api/ai/chat", e);
    return NextResponse.json(
      { reply: "AI assistant is temporarily unavailable. Please try again." },
      { status: 200 }
    );
  }
}
