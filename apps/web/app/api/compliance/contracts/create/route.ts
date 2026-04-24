import { NextResponse } from "next/server";
import {
  BrokerageContractStatus,
  BrokerageContractType,
  ComplianceFormAction,
  ComplianceFormEntityType,
  OaciqMandatoryFormVersion,
} from "@prisma/client";
import { complianceFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { prisma } from "@/lib/db";
import {
  logComplianceFormEvent,
  upsertBrokerageContract,
} from "@/modules/legal/compliance/lecipm-oaciq-brokerage-forms.service";

export const dynamic = "force-dynamic";

type Body = {
  listingId?: string;
  contractType?: string;
  formVersion?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  includesDistributionAuthorization?: boolean;
  distributionScope?: unknown;
};

function parseContractType(raw: string | undefined): BrokerageContractType {
  if (raw === "exclusive") return BrokerageContractType.exclusive;
  if (raw === "non_exclusive") return BrokerageContractType.non_exclusive;
  throw new Error("CONTRACT_TYPE_REQUIRED");
}

function parseContractStatus(raw: string | undefined): BrokerageContractStatus | undefined {
  if (raw === "active") return BrokerageContractStatus.active;
  if (raw === "expired") return BrokerageContractStatus.expired;
  if (raw === "terminated") return BrokerageContractStatus.terminated;
  if (raw === "draft") return BrokerageContractStatus.draft;
  return undefined;
}

export async function POST(req: Request) {
  if (!complianceFlags.lecipmOaciqBrokerageFormsEngineV1) {
    return NextResponse.json({ error: "FEATURE_DISABLED" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingId = body.listingId?.trim();
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (body.formVersion !== OaciqMandatoryFormVersion.REFORM_2022_MANDATORY) {
    return NextResponse.json({ error: "INVALID_FORM_VERSION" }, { status: 422 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { tenantId: true },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  try {
    const contractType = parseContractType(body.contractType);
    const idRow = await upsertBrokerageContract({
      listingId,
      brokerId: userId,
      agencyId: listing.tenantId ?? null,
      contractType,
      formVersion: OaciqMandatoryFormVersion.REFORM_2022_MANDATORY,
      status: parseContractStatus(body.status) ?? BrokerageContractStatus.draft,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      includesDistributionAuthorization: body.includesDistributionAuthorization,
      distributionScope: body.distributionScope ?? null,
    });

    await logComplianceFormEvent(prisma, {
      entityType: ComplianceFormEntityType.contract,
      entityId: idRow.id,
      action: ComplianceFormAction.created,
      performedByUserId: userId,
      notes: "brokerage_contract_upsert",
    });

    return NextResponse.json({ ok: true, contractId: idRow.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "INVALID_FORM_VERSION" || msg === "CONTRACT_TYPE_REQUIRED") {
      return NextResponse.json({ error: msg }, { status: 422 });
    }
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
