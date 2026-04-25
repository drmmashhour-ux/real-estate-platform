import { brokerageOfficeFlags } from "@/config/feature-flags";
import { getOfficeAccess, getDefaultOfficeIdForUser } from "@/lib/brokerage/office-access";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { createBrokerageOffice, getOfficeWithSettings } from "@/modules/brokerage-office/brokerage-office.service";
import { brokerageOfficeDisclaimer } from "@/modules/brokerage-office/office-explainer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerageOfficeFlags.officeManagementV1) {
    return Response.json({ error: "Office management disabled" }, { status: 403 });
  }

  const officeId = new URL(request.url).searchParams.get("officeId") ?? (await getDefaultOfficeIdForUser(session.userId));
  if (!officeId) {
    return Response.json({ office: null, disclaimer: brokerageOfficeDisclaimer() });
  }

  const access = await getOfficeAccess(session.userId, officeId);
  if (!access) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const office = await getOfficeWithSettings(officeId);
  return Response.json({ office, access, disclaimer: brokerageOfficeDisclaimer() });
}

export async function POST(request: Request) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerageOfficeFlags.officeManagementV1) {
    return Response.json({ error: "Office management disabled" }, { status: 403 });
  }

  let body: { name?: string; legalName?: string; officeCode?: string; region?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return Response.json({ error: "name required" }, { status: 400 });
  }

  const existing = await getDefaultOfficeIdForUser(session.userId);
  if (existing) {
    return Response.json({ error: "Already member of an office — use another flow for multi-office" }, { status: 409 });
  }

  const office = await createBrokerageOffice({
    name: body.name.trim(),
    ownerUserId: session.userId,
    legalName: body.legalName,
    officeCode: body.officeCode,
    region: body.region,
  });

  return Response.json({ office, disclaimer: brokerageOfficeDisclaimer() });
}
