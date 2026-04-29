import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { submitSybnbListingReportCore } from "@/lib/sybnb/submit-sybnb-listing-report";
import { assertSybnb5PerMin, firstZodIssueMessage, sybnbFail, sybnbJson } from "@/lib/sybnb/sybnb-api-http";
import { sybnbIdParam, sybnbReportBody } from "@/lib/sybnb/sybnb-api-schemas";
import { s2GetClientIp } from "@/lib/security/s2-ip";
import { normalizeSy8ReportReason } from "@/lib/sy8/sy8-constants";
import { sybnbApiCatch } from "@/lib/sybnb/sybnb-api-catch";

type RouteParams = { params: Promise<{ id: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleListingReportPOST(req: NextRequest, context: RouteParams): Promise<Response> {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return sybnbFail("Service unavailable", 503);
  }
  const user = await getSessionUser();
  if (!user) {
    return sybnbFail("unauthorized", 401);
  }

  const { id: rawId } = await context.params;
  const idParsed = sybnbIdParam.safeParse(rawId);
  if (!idParsed.success) {
    return sybnbFail(firstZodIssueMessage(idParsed.error), 400);
  }
  const propertyId = idParsed.data;

  const tooMany = assertSybnb5PerMin("listing_report", s2GetClientIp(req));
  if (tooMany) {
    return tooMany;
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return sybnbFail("Invalid JSON", 400);
  }
  const b = sybnbReportBody.safeParse(raw ?? {});
  if (!b.success) {
    return sybnbFail(firstZodIssueMessage(b.error), 400);
  }
  const reason = normalizeSy8ReportReason(b.data.reason ?? "wrong_info");

  const res = await submitSybnbListingReportCore({ reporterId: user.id, propertyId, reason });
  if (!res.ok) {
    return sybnbFail(res.error, 400);
  }
  return sybnbJson({ propertyId: res.propertyId });
}

export async function POST(req: NextRequest, context: RouteParams): Promise<Response> {
  return sybnbApiCatch(() => handleListingReportPOST(req, context));
}
