import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { sendFormSubmissionNotificationToAdmin } from "@/lib/email/notifications";
import { formatFormActivityNote } from "@/lib/forms/form-activity";
import { engineFlags } from "@/config/feature-flags";
import { logLeadSubmitted } from "@/modules/growth/fast-deal-landing-results.service";

export const dynamic = "force-dynamic";

const EARLY_CONVERSION_FORM_TYPE = "early_conversion_lead";

/** Stored in payloadJson.metadata — no DB migration. */
export function computeEarlyLeadPriority(notes: string | undefined, propertyLinkOrAddress: string): "high" | "normal" {
  const n = (notes ?? "").trim();
  const p = propertyLinkOrAddress.trim();
  if (n.length > 30) return "high";
  const combined = `${n} ${p}`.toLowerCase();
  const priceLike = /\$|€|£|\brent\b|\bprice\b|\/mo\b|\bmonth(ly)?\b|\b\d{3,4}\s*(\$|cad|usd)/i;
  const addressLike =
    /\d{1,5}\s+\w[\w\s]{2,40}(st|street|ave|avenue|rd|road|blvd|boulevard|ch|cr|route)\b/i.test(combined) ||
    /\b(h[0-9][a-z][0-9][a-z])\b/i.test(combined) ||
    /\b(montreal|montréal|laval|québec|quebec|gatineau|ottawa)\b/i.test(combined);
  if (priceLike.test(combined) || addressLike) return "high";
  return "normal";
}

const bodySchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.string().max(320).optional(),
    phone: z.string().max(40).optional(),
    propertyLinkOrAddress: z.string().min(1).max(2000),
    notes: z.string().max(4000).optional(),
    metadata: z
      .object({
        utm_source: z.string().max(200).optional(),
        utm_campaign: z.string().max(200).optional(),
        utm_medium: z.string().max(200).optional(),
      })
      .optional(),
    /** Growth Machine preview only — optional attribution for Fast Deal results (ignored if absent). */
    growthDashMarket: z.string().max(120).optional(),
    growthDashChannel: z.string().max(80).optional(),
  })
  .superRefine((data, ctx) => {
    const emailRaw = data.email?.trim() ?? "";
    const phoneRaw = data.phone?.trim() ?? "";
    const hasPhone = phoneRaw.length > 0;
    if (emailRaw.length > 0) {
      const ok = z.string().email().safeParse(emailRaw).success;
      if (!ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid email", path: ["email"] });
      }
    }
    if (emailRaw.length === 0 && !hasPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide an email or phone number.",
        path: ["email"],
      });
    }
  });

/** Public early-conversion capture → FormSubmission + optional admin email (same pattern as POST /api/forms). */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`growth:early_leads:${ip}`, { windowMs: 60_000, max: 10 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: getRateLimitHeaders(rl) },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const b = parsed.data;
  const emailTrim = b.email?.trim() || "";
  const phoneTrim = b.phone?.trim() || "";
  const clientEmail = emailTrim.length > 0 ? emailTrim.toLowerCase() : null;
  const propertyTrim = b.propertyLinkOrAddress.trim();
  const notesTrim = b.notes?.trim() || "";
  const priorityLevel = computeEarlyLeadPriority(notesTrim || undefined, propertyTrim);

  const utm = b.metadata;
  const metadata: Record<string, unknown> = {
    priorityLevel,
    ...(utm?.utm_source ? { utm_source: utm.utm_source.trim() } : {}),
    ...(utm?.utm_campaign ? { utm_campaign: utm.utm_campaign.trim() } : {}),
    ...(utm?.utm_medium ? { utm_medium: utm.utm_medium.trim() } : {}),
  };

  const payload: Record<string, unknown> = {
    phone: phoneTrim || undefined,
    propertyLinkOrAddress: propertyTrim,
    notes: notesTrim || undefined,
    source: "get_leads_landing",
    referrer: typeof req.headers.get === "function" ? req.headers.get("referer") : null,
    metadata,
  };

  try {
    const submission = await prisma.formSubmission.create({
      data: {
        formType: EARLY_CONVERSION_FORM_TYPE,
        status: "submitted",
        clientName: b.name.trim(),
        clientEmail: clientEmail ?? undefined,
        payloadJson: payload as Prisma.InputJsonValue,
      },
    });

    await prisma.formActivity.create({
      data: {
        formSubmissionId: submission.id,
        action: "created",
        note: formatFormActivityNote("Client", "Submitted early conversion lead form"),
      },
    });

    sendFormSubmissionNotificationToAdmin({
      formType: EARLY_CONVERSION_FORM_TYPE,
      submissionId: submission.id,
      clientName: submission.clientName ?? undefined,
      clientEmail: clientEmail ?? undefined,
    }).catch((e) => console.error("[early-leads] Admin notification failed:", e));

    const dashMarket = b.growthDashMarket?.trim();
    if (
      engineFlags.fastDealResultsV1 &&
      dashMarket &&
      dashMarket.length > 0
    ) {
      void logLeadSubmitted({
        marketVariant: dashMarket,
        formSubmissionId: submission.id,
        cta: b.growthDashChannel?.trim(),
      });
    }

    return NextResponse.json({ ok: true, submissionId: submission.id }, { headers: getRateLimitHeaders(rl) });
  } catch (e) {
    console.error("POST /api/growth/early-leads:", e);
    return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 });
  }
}
