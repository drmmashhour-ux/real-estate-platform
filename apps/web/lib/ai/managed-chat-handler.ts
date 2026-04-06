import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { runLecipmManagerChat } from "@/lib/ai/orchestrator";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import type { AgentKey, ManagerAiContext } from "@/lib/ai/types";
import { isLocaleCode, type LocaleCode } from "@/lib/i18n/locales";
import { AGENT_KEYS } from "@/lib/ai/types";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import type { PlatformRole } from "@prisma/client";

function isAgentKey(s: string): s is AgentKey {
  return (AGENT_KEYS as readonly string[]).includes(s);
}

async function resolveLecipmManagerUser(request: Request): Promise<{ id: string; role: PlatformRole } | null> {
  const cookieUserId = await getGuestId();
  if (cookieUserId) {
    const row = await prisma.user.findUnique({
      where: { id: cookieUserId },
      select: { id: true, role: true },
    });
    if (row) return row;
  }
  const mobile = await getMobileAuthUser(request);
  if (!mobile) return null;
  let row = await prisma.user.findUnique({
    where: { id: mobile.id },
    select: { id: true, role: true },
  });
  if (!row && mobile.email) {
    row = await prisma.user.findUnique({
      where: { email: mobile.email },
      select: { id: true, role: true },
    });
  }
  return row;
}

export async function handleLecipmManagerChat(request: Request, body: Record<string, unknown>) {
  const prismaUser = await resolveLecipmManagerUser(request);
  if (!prismaUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = prismaUser.id;

  const limit = checkRateLimit(`ai:manager:${userId}`, { windowMs: 60_000, max: 40 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getRateLimitHeaders(limit) },
    );
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const user = { role: prismaUser.role };

  const ctxRaw = body.context;
  const bodyUiLocale = body.uiLocale;
  const trimmedUi = typeof bodyUiLocale === "string" ? bodyUiLocale.trim() : "";
  const topUi: LocaleCode | undefined = isLocaleCode(trimmedUi) ? trimmedUi : undefined;
  const context: ManagerAiContext =
    ctxRaw && typeof ctxRaw === "object"
      ? {
          listingId: typeof (ctxRaw as { listingId?: string }).listingId === "string"
            ? (ctxRaw as { listingId: string }).listingId
            : undefined,
          bookingId: typeof (ctxRaw as { bookingId?: string }).bookingId === "string"
            ? (ctxRaw as { bookingId: string }).bookingId
            : undefined,
          role:
            typeof (ctxRaw as { role?: string }).role === "string"
              ? (ctxRaw as { role: string }).role
              : String(prismaUser.role),
          surface:
            (ctxRaw as { surface?: string }).surface === "mobile" || (ctxRaw as { surface?: string }).surface === "admin"
              ? ((ctxRaw as { surface: "mobile" | "admin" }).surface as ManagerAiContext["surface"])
              : "web",
          uiLocale: (() => {
            const u = (ctxRaw as { uiLocale?: string }).uiLocale;
            if (typeof u !== "string") return topUi;
            const t = u.trim();
            return isLocaleCode(t) ? t : topUi;
          })(),
        }
      : { role: user.role, surface: "web", uiLocale: topUi };

  const agentRaw = typeof body.agentKey === "string" ? body.agentKey : "";
  const agentKey = isAgentKey(agentRaw) ? agentRaw : null;
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : null;

  const admin = await isPlatformAdmin(userId);
  if (context.surface === "admin" && !admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const out = await runLecipmManagerChat({
    userId,
    role: user.role,
    message,
    conversationId,
    context,
    agentKey,
    isAdmin: admin,
    uiLocaleHint: topUi,
  });

  return NextResponse.json({
    reply: out.reply,
    agentKey: out.agentKey,
    decisionMode: out.decisionMode,
    structured: out.structured ?? null,
    conversationId: out.conversationId,
    lecipmManager: true,
  });
}
