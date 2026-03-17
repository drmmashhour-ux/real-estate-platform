import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  getOwnerIdentity,
  getBrokerIdentity,
  getOrganizationIdentity,
  getPropertyIdentityNetworkView,
  getIdentityRiskProfile,
  getIdentityLinks,
} from "@/lib/identity-network";
/**
 * GET /api/admin/identity-network/investigation/:id
 * Returns full identity details for admin investigation.
 * Id can be property, owner, broker, or organization (we try each).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id } = await context.params;

    const [owner, broker, org, propertyView] = await Promise.all([
      getOwnerIdentity(id),
      getBrokerIdentity(id),
      getOrganizationIdentity(id),
      getPropertyIdentityNetworkView(id),
    ]);

    if (owner) {
      const [risk, links] = await Promise.all([
        getIdentityRiskProfile("OWNER", id),
        getIdentityLinks("OWNER", id),
      ]);
      return Response.json({
        type: "owner",
        identity: owner,
        riskProfile: risk,
        linkedUsers: links,
      });
    }
    if (broker) {
      const [risk, links] = await Promise.all([
        getIdentityRiskProfile("BROKER", id),
        getIdentityLinks("BROKER", id),
      ]);
      return Response.json({
        type: "broker",
        identity: broker,
        riskProfile: risk,
        linkedUsers: links,
      });
    }
    if (org) {
      const risk = await getIdentityRiskProfile("ORGANIZATION", id);
      return Response.json({
        type: "organization",
        identity: org,
        riskProfile: risk,
      });
    }
    if (propertyView) {
      return Response.json({
        type: "property",
        identity: propertyView,
      });
    }

    return Response.json({ error: "Identity not found" }, { status: 404 });
  } catch (e) {
    return Response.json({ error: "Investigation lookup failed" }, { status: 500 });
  }
}
