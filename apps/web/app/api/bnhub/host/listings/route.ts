import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getApprovedHost, hasAcceptedHostAgreement } from "@/lib/bnhub/host";
import { prisma } from "@repo/db";
import { legalRiskAlertMessage } from "@/modules/legal/engine/legal-engine.service";
import { buildLegalRiskInputFromBnhubCreate } from "@/modules/legal/engine/legal-risk-input";
import {
  evaluateLegalCompliance,
  persistLegalComplianceArtifacts,
  syncPropertyAndSellerProfiles,
} from "@/modules/legal/legal-orchestration.service";

export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const host = await getApprovedHost(userId);
  if (!host) {
    return Response.json(
      { error: "Approved host required. Apply at /bnhub/become-host" },
      { status: 403 }
    );
  }

  const listings = await prisma.bnhubHostListing.findMany({
    where: { hostId: host.id },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(listings);
}

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const host = await getApprovedHost(userId);
  if (!host) {
    return Response.json(
      { error: "Only approved hosts can create listings. Apply at /bnhub/become-host" },
      { status: 403 }
    );
  }

  const agreementAccepted = await hasAcceptedHostAgreement(host.id);
  if (!agreementAccepted) {
    return Response.json(
      { error: "You must accept the Host Agreement before creating listings. Visit /bnhub/host-agreement" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      location,
      price,
      maxGuests,
      images,
    } = body as {
      title?: string;
      description?: string;
      location?: string;
      price?: number;
      maxGuests?: number;
      images?: string[];
    };

    if (!title || !location || price == null || Number(price) < 0) {
      return Response.json(
        { error: "title, location, and price are required" },
        { status: 400 }
      );
    }

    const listing = await prisma.bnhubHostListing.create({
      data: {
        hostId: host.id,
        title: String(title),
        description: description ?? null,
        location: String(location),
        price: Number(price),
        maxGuests: Math.max(1, Number(maxGuests) || 4),
        images: Array.isArray(images) ? images : [],
      },
    });
    const base = buildLegalRiskInputFromBnhubCreate({
      title: String(title),
      description: description ?? null,
      price: Number(price),
      location: String(location),
    });
    const legalCompliance = evaluateLegalCompliance({
      ...base,
      sellerFraud: {
        listingDescription: `${String(title)}\n${(description ?? "").trim()}`,
        sellerDeclarationJson: null,
      },
    });
    await syncPropertyAndSellerProfiles(legalCompliance, {
      listingScope: "BNHUB",
      listingId: listing.id,
      sellerUserId: userId,
      persistAlerts: true,
      actorUserId: userId,
    });
    await persistLegalComplianceArtifacts(legalCompliance, {
      listingScope: "BNHUB",
      listingId: listing.id,
      sellerUserId: userId,
      persistAlerts: true,
      actorUserId: userId,
    });

    return Response.json(
      {
        ...listing,
        legalRisk: legalCompliance.engine,
        legalRiskAlert: legalRiskAlertMessage(legalCompliance.engine),
        legalCompliance,
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("POST /api/bnhub/host/listings:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 400 }
    );
  }
}
