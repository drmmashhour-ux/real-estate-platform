import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { LeadContactOrigin } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import {
  CLIENT_CHAT_DISCLAIMER,
  processClientChatTurn,
  buildLeadPayloadFromChat,
  computeChatLeadScore,
  classifyQuebecTier,
  tierToScore,
  type ClientChatContext,
  type QualificationState,
} from "@/lib/ai/client-communication-chat";
import {
  recordHotLeadAlert,
  recordClientChatHandoff,
  recordClientChatEscalation,
  recordWarmFollowUpIntent,
  recordColdNurtureIntent,
} from "@/lib/ai/automation-triggers";
import { mergeFormAndBehaviorScore } from "@/lib/ai/behavior-scoring";
import {
  sendLeadNotificationToBroker,
  sendClientConfirmationEmail,
  sendImmoContactAcknowledgement,
  bnhubListingPublicUrl,
} from "@/lib/email/notifications";
import { snapshotBnhubListingForLead } from "@/lib/leads/bnhub-listing-context";
import { findRecentListingLeadDuplicate } from "@/lib/crm/lead-dedupe";
import { logAiEvent } from "@/lib/ai/log";
import { triggerAiFollowUpForLead } from "@/lib/ai/follow-up/orchestrator";
import { getLeadAttributionFromRequest } from "@/lib/attribution/lead-attribution";
import {
  assertImmoContactLegalForSession,
  assertImmoGuestCanMessage,
} from "@/lib/immo/immo-contact-legal-gate";

export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string | undefined {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined
  );
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const raw =
    process.env.AI_CLIENT_CHAT_CORS_ORIGINS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  if (raw.length === 0) return {};
  const allow =
    raw.includes("*") || (origin && raw.includes(origin)) ? origin || "*" : "";
  if (!allow) return {};
  return {
    "Access-Control-Allow-Origin": allow === "*" ? "*" : origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS(req: NextRequest) {
  const h = corsHeaders(req);
  return new NextResponse(null, { status: 204, headers: h });
}

function normalizeState(body: Record<string, unknown>): QualificationState {
  const s = body.state as Record<string, unknown> | undefined;
  return {
    transcript: Array.isArray(s?.transcript) ? (s!.transcript as string[]) : [],
    timeline: s?.timeline as QualificationState["timeline"] | undefined,
    budgetRange: typeof s?.budgetRange === "string" ? s.budgetRange : undefined,
    financing: s?.financing as QualificationState["financing"] | undefined,
    name: typeof s?.name === "string" ? s.name : undefined,
    phone: typeof s?.phone === "string" ? s.phone : undefined,
    email: typeof s?.email === "string" ? s.email : undefined,
    visitIntent: s?.visitIntent === true,
    brokerSpeakIntent: s?.brokerSpeakIntent === true,
    preferredContactTime: typeof s?.preferredContactTime === "string" ? s.preferredContactTime : undefined,
    emailOptionalPhase: s?.emailOptionalPhase === "asked" ? "asked" : undefined,
    emailDeclined: s?.emailDeclined === true,
  };
}

function sanitizeId(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || s === "undefined" || s === "null") return null;
  return s;
}

function normalizeContext(body: Record<string, unknown>): ClientChatContext {
  const c = body.context as Record<string, unknown> | undefined;
  return {
    listingId: sanitizeId(c?.listingId),
    projectId: sanitizeId(c?.projectId),
    listingTitle: c?.listingTitle != null ? String(c.listingTitle) : null,
    city: c?.city != null ? String(c.city) : null,
    availabilityNote: c?.availabilityNote != null ? String(c.availabilityNote) : null,
    features: Array.isArray(c?.features) ? (c!.features as string[]).filter((x) => typeof x === "string") : undefined,
    introducedByBrokerId: c?.introducedByBrokerId != null ? String(c.introducedByBrokerId) : null,
  };
}

async function persistChatSession(params: {
  context: ClientChatContext;
  state: QualificationState;
  tier: string | null;
  score: number | null;
  leadId?: string | null;
}) {
  await prisma.aiClientChatSession
    .create({
      data: {
        listingId: params.context.listingId ?? undefined,
        projectId: params.context.projectId ?? undefined,
        leadId: params.leadId ?? undefined,
        tier: params.tier,
        score: params.score ?? undefined,
        transcript: params.state.transcript as object,
        answers: {
          timeline: params.state.timeline,
          budgetRange: params.state.budgetRange,
          financing: params.state.financing,
          visitIntent: params.state.visitIntent,
          preferredContactTime: params.state.preferredContactTime,
          brokerSpeakIntent: params.state.brokerSpeakIntent,
        },
        complianceTag: "quebec_real_estate_v1",
      },
    })
    .catch(() => {});
}

/**
 * POST /api/ai/client-chat — Québec-aware client assistant (qualify, capture, handoff).
 */
export async function POST(req: NextRequest) {
  const cors = corsHeaders(req);
  try {
    const body = await req.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message : "";
    const state = normalizeState(body);
    const context = normalizeContext(body);
    const leadIdCreated = typeof body.leadIdCreated === "string" ? body.leadIdCreated : null;
    const consentSmsWhatsapp = body.consentSmsWhatsapp === true;
    const consentVoice = body.consentVoice === true;
    const localePref = typeof body.locale === "string" ? body.locale.slice(0, 12) : undefined;
    const immoFlow = body.flow === "immo_high_conversion";
    const collaborationNoticeAccepted = body.collaborationNoticeAccepted === true;
    const sessionUserIdGate = await getGuestId();

    if (immoFlow && context.listingId) {
      if (message.trim()) {
        const guestOk = assertImmoGuestCanMessage(sessionUserIdGate);
        if (!guestOk.ok) {
          return NextResponse.json(
            {
              error: guestOk.message,
              code: guestOk.code,
              disclaimer: CLIENT_CHAT_DISCLAIMER,
            },
            { status: 403, headers: cors }
          );
        }
      }
      const legal = await assertImmoContactLegalForSession({
        brokerId: context.introducedByBrokerId,
        buyerUserId: sessionUserIdGate,
        requireBuyerAck: Boolean(sessionUserIdGate),
      });
      if (!legal.ok) {
        return NextResponse.json(
          {
            error: legal.message,
            code: legal.code,
            brokerReasons: legal.brokerReasons,
            missing: legal.missing,
            disclaimer: CLIENT_CHAT_DISCLAIMER,
          },
          { status: 403, headers: cors }
        );
      }
    }

    const result = processClientChatTurn({ message, state, context });

    if (result.flags.escalateToBroker && result.flags.escalationReason !== "hot_lead_handoff") {
      await recordClientChatEscalation({
        brokerId: context.introducedByBrokerId,
        reason: result.flags.escalationReason ?? "escalation",
        lastMessage: message || "(no message)",
        context: {
          listingId: context.listingId,
          city: context.city,
        },
      }).catch(() => {});
    }

    let leadId: string | null | undefined = leadIdCreated ?? undefined;

    if (result.flags.chatCompleteCold) {
      await persistChatSession({
        context,
        state: result.state,
        tier: "cold",
        score: tierToScore("cold"),
        leadId: null,
      });
    }

    const contactCaptureDone =
      Boolean(result.state.name?.trim()) &&
      Boolean(result.state.phone?.trim()) &&
      (Boolean(result.state.email?.trim()) || result.state.emailDeclined === true);

    if (result.flags.leadReady && contactCaptureDone) {
      const { merged, qScore, qReasons } = computeChatLeadScore(result.state);
      const tierAuthoritative = classifyQuebecTier(result.state);
      let finalScore = merged;
      const sessionUserId = await getGuestId();
      let linkedUserId: string | undefined;
      const realEmail = result.state.email?.trim();
      if (sessionUserId && realEmail) {
        const self = await prisma.user.findUnique({
          where: { id: sessionUserId },
          select: { email: true },
        });
        if (self?.email?.toLowerCase() === realEmail.toLowerCase()) {
          linkedUserId = sessionUserId;
        }
      }
      if (linkedUserId) {
        const prof = await prisma.userAiProfile.findUnique({ where: { userId: linkedUserId } });
        if (prof && prof.behaviorLeadScore > 0) {
          finalScore = mergeFormAndBehaviorScore(merged, prof.behaviorLeadScore).merged;
        }
      }

      const payload = buildLeadPayloadFromChat(result.state, finalScore, tierAuthoritative, qScore, qReasons);
      const placeholderEmail = `inquiry.${randomUUID().replace(/-/g, "").slice(0, 16)}@immocontact.placeholder`;
      const storeEmail = realEmail || placeholderEmail;
      const brokerMessage =
        payload.message +
        (!realEmail ? "\n\n---\nNote: Client did not provide email; phone is the primary contact." : "");

      const listingSnap = await snapshotBnhubListingForLead(context.listingId);
      const effectiveListingId = listingSnap?.listingId ?? context.listingId ?? null;
      const listingNotifyUrl = bnhubListingPublicUrl(
        listingSnap?.listingCode ?? listingSnap?.listingId ?? context.listingId ?? null
      );

      let dedupedLeadId: string | null = null;
      if (realEmail && effectiveListingId) {
        const dup = await findRecentListingLeadDuplicate({
          listingId: effectiveListingId,
          email: realEmail,
        });
        if (dup) dedupedLeadId = dup.id;
      }

      const aiExplanation = {
        ...payload.qualificationSnapshot,
        immoHighConversion: immoFlow,
        clientEmailProvided: Boolean(realEmail),
        listingTitle: context.listingTitle,
      };

      const traffic = getLeadAttributionFromRequest(req.headers.get("cookie"), body);

      const initLeadId = leadId ?? null;
      let dbLead: Awaited<ReturnType<typeof prisma.lead.findUniqueOrThrow>> | undefined;
      let usedEmailDedupe = false;
      let initImmoUpdated = false;

      if (initLeadId && immoFlow) {
        const pre = await prisma.lead.findUnique({
          where: { id: initLeadId },
          select: { id: true, contactOrigin: true, listingId: true },
        });
        if (
          pre?.contactOrigin === LeadContactOrigin.IMMO_CONTACT &&
          pre.listingId === effectiveListingId
        ) {
          dbLead = await prisma.lead.update({
            where: { id: initLeadId },
            data: {
              name: payload.name,
              email: storeEmail,
              phone: payload.phone,
              message: brokerMessage,
              listingId: listingSnap?.listingId ?? context.listingId ?? undefined,
              listingCode: listingSnap?.listingCode ?? undefined,
              projectId: context.projectId ?? undefined,
              score: finalScore,
              userId: linkedUserId,
              aiExplanation: aiExplanation as object,
              contactUnlockedAt: new Date(),
              introducedByBrokerId: context.introducedByBrokerId ?? undefined,
              leadSource: immoFlow ? "immo_ai_chat" : "ai_chat",
              aiTier: tierAuthoritative,
              source: traffic.source,
              campaign: traffic.campaign,
              medium: traffic.medium,
              contactOrigin: LeadContactOrigin.IMMO_CONTACT,
              commissionSource: LeadContactOrigin.IMMO_CONTACT,
              commissionEligible: true,
            },
          });
          leadId = dbLead.id;
          initImmoUpdated = true;
          await prisma.leadContactAuditEvent
            .create({
              data: {
                leadId: dbLead.id,
                eventType: "immo_contact_qualified",
                actorUserId: sessionUserId ?? undefined,
                listingId: effectiveListingId ?? undefined,
                metadata: { collaborationNoticeAccepted } as object,
              },
            })
            .catch(() => {});
        }
      }

      if (!initImmoUpdated) {
        dbLead = dedupedLeadId
          ? await prisma.lead.findUniqueOrThrow({ where: { id: dedupedLeadId } })
          : await prisma.lead.create({
              data: {
                name: payload.name,
                email: storeEmail,
                phone: payload.phone,
                message: brokerMessage,
                listingId: listingSnap?.listingId ?? context.listingId ?? undefined,
                listingCode: listingSnap?.listingCode ?? undefined,
                projectId: context.projectId ?? undefined,
                status: "new",
                score: finalScore,
                userId: linkedUserId,
                aiExplanation: aiExplanation as object,
                contactUnlockedAt: new Date(),
                introducedByBrokerId: context.introducedByBrokerId ?? undefined,
                leadSource: immoFlow ? "immo_ai_chat" : "ai_chat",
                aiTier: tierAuthoritative,
                source: traffic.source,
                campaign: traffic.campaign,
                medium: traffic.medium,
                contactOrigin: immoFlow ? LeadContactOrigin.IMMO_CONTACT : undefined,
                commissionSource: immoFlow ? LeadContactOrigin.IMMO_CONTACT : undefined,
                firstPlatformContactAt: immoFlow ? new Date() : undefined,
                commissionEligible: immoFlow ? true : undefined,
              },
            });
        leadId = dbLead.id;
        usedEmailDedupe = Boolean(dedupedLeadId);
      }

      if (!dbLead) {
        throw new Error("Lead persistence failed: no lead record after create/update");
      }

      if (usedEmailDedupe) {
        logAiEvent("client_chat_lead_deduped", {
          leadId: dbLead.id,
          tier: tierAuthoritative,
          flow: immoFlow ? "immo_high_conversion" : "standard",
        });
      } else {
        logAiEvent(initImmoUpdated ? "client_chat_immo_lead_qualified" : "client_chat_lead_created", {
          leadId: dbLead.id,
          tier: tierAuthoritative,
          quebecCompliance: true,
          flow: immoFlow ? "immo_high_conversion" : "standard",
          hot: tierAuthoritative === "hot",
        });

        if (sessionUserId && tierAuthoritative === "hot") {
          await prisma.aiUserActivityLog
            .create({
              data: {
                userId: sessionUserId,
                eventType: "funnel_broker_handoff_logged",
                listingId: context.listingId ?? undefined,
                metadata: { leadId: dbLead.id, source: immoFlow ? "immo_ai_chat" : "ai_chat" },
              },
            })
            .catch(() => {});
        }

        await sendLeadNotificationToBroker({
          name: dbLead.name,
          email: realEmail || dbLead.email,
          phone: dbLead.phone,
          message: dbLead.message,
          listingCode: dbLead.listingCode,
          listingUrl: listingNotifyUrl,
        }).catch(() => {});
        if (realEmail) {
          if (immoFlow) {
            await sendImmoContactAcknowledgement(
              realEmail,
              dbLead.name,
              context.listingTitle ?? undefined
            ).catch(() => {});
          } else {
            await sendClientConfirmationEmail(realEmail, dbLead.name).catch(() => {});
          }
        }

        if (context.introducedByBrokerId && tierAuthoritative === "hot") {
          await recordHotLeadAlert({
            brokerId: context.introducedByBrokerId,
            leadId: dbLead.id,
            mergedScore: finalScore,
          }).catch(() => {});
        }
        if (context.introducedByBrokerId && tierAuthoritative === "warm") {
          await recordWarmFollowUpIntent({
            brokerId: context.introducedByBrokerId,
            leadId: dbLead.id,
          }).catch(() => {});
        }
        if (context.introducedByBrokerId && tierAuthoritative === "cold") {
          await recordColdNurtureIntent({
            brokerId: context.introducedByBrokerId,
            leadId: dbLead.id,
          }).catch(() => {});
        }

        if (result.flags.escalateToBroker && result.flags.escalationReason) {
          await recordClientChatHandoff({
            brokerId: context.introducedByBrokerId,
            leadId: dbLead.id,
            reason: result.flags.escalationReason,
            tier: tierAuthoritative,
          }).catch(() => {});
        }

        void triggerAiFollowUpForLead({
          leadId: dbLead.id,
          source: immoFlow ? "immo_ai_chat" : "ai_chat",
          phone: dbLead.phone,
          score: finalScore,
          aiTier: tierAuthoritative,
          listingId: context.listingId ?? null,
          introducedByBrokerId: context.introducedByBrokerId ?? null,
          consent: {
            smsWhatsapp: consentSmsWhatsapp,
            voice: consentVoice,
            locale: localePref ?? null,
          },
          requestMeta: {
            sourcePage: immoFlow ? "immo_ai_chat" : "client_chat",
            ip: clientIp(req),
            userAgent: req.headers.get("user-agent") ?? undefined,
          },
        }).catch(() => {});
      }

      await persistChatSession({
        context,
        state: result.state,
        tier: tierAuthoritative,
        score: finalScore,
        leadId,
      });
    }

    return NextResponse.json(
      {
        reply: result.reply,
        state: result.state,
        flags: result.flags,
        disclaimer: result.disclaimer,
        leadId: leadId ?? undefined,
        quebecTier: result.flags.qualificationTier,
      },
      { headers: cors }
    );
  } catch (e) {
    console.error("POST /api/ai/client-chat", e);
    return NextResponse.json(
      {
        error: "Chat failed",
        reply: "Something went wrong. Please try again or contact the office directly.",
        disclaimer: CLIENT_CHAT_DISCLAIMER,
      },
      { status: 500, headers: cors }
    );
  }
}
