import { brokerageOfficeFlags } from "@/config/feature-flags";
import { getOfficeAccess, getDefaultOfficeIdForUser } from "@/lib/brokerage/office-access";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";

export async function resolveBrokerOfficeRequest(request: Request, flag: keyof typeof brokerageOfficeFlags) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return { error: session.response as Response };

  if (!brokerageOfficeFlags[flag]) {
    return { error: Response.json({ error: "Feature disabled" }, { status: 403 }) };
  }

  const url = new URL(request.url);
  const officeId = url.searchParams.get("officeId") ?? (await getDefaultOfficeIdForUser(session.userId));
  if (!officeId) {
    return { error: Response.json({ error: "officeId required or create an office first" }, { status: 400 }) };
  }

  const access = await getOfficeAccess(session.userId, officeId);
  if (!access) {
    return { error: Response.json({ error: "Not a member of this office" }, { status: 403 }) };
  }

  return { session, officeId, access };
}
