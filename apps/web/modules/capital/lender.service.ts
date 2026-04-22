import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendDealAuditEvent } from "@/modules/deals/deal-audit.service";
import type { LenderStatus } from "./capital.types";
import { logDealCapitalTimeline } from "./capital-timeline.service";

const TAG = "[capital.lender]";
const ORDER: LenderStatus[] = ["TARGET", "CONTACTED", "PACKAGE_SENT", "OFFER_RECEIVED", "SELECTED", "REJECTED"];

function assertForwardOrSame(from: string, to: string): void {
  const fi = ORDER.indexOf(from as LenderStatus);
  const ti = ORDER.indexOf(to as LenderStatus);
  if (fi === -1 || ti === -1) throw new Error("Invalid lender status");
  if (to === "REJECTED") return;
  // Allow any forward jump (e.g. TARGET → OFFER_RECEIVED when an offer arrives)
  if (ti < fi) throw new Error("Cannot move lender status backwards");
}

export async function listLenders(dealId: string) {
  return prisma.lecipmPipelineDealLender.findMany({
    where: { dealId },
    orderBy: { createdAt: "asc" },
    include: { offers: { orderBy: { createdAt: "desc" } } },
  });
}

export async function addLender(
  dealId: string,
  input: {
    lenderName: string;
    contactName?: string | null;
    contactEmail?: string | null;
    notes?: string | null;
  },
  actorUserId: string | null
) {
  const row = await prisma.lecipmPipelineDealLender.create({
    data: {
      dealId,
      lenderName: input.lenderName.slice(0, 512),
      contactName: input.contactName?.slice(0, 256) ?? undefined,
      contactEmail: input.contactEmail?.slice(0, 320) ?? undefined,
      notes: input.notes?.slice(0, 8000) ?? undefined,
      status: "TARGET",
    },
  });

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "LENDER_ADDED",
    actorUserId,
    summary: `Lender added: ${row.lenderName}`,
    metadataJson: { lenderId: row.id },
  });
  await logDealCapitalTimeline(dealId, "LENDER_ADDED", `Lender ${row.lenderName}`);

  logInfo(TAG, { dealId, lenderId: row.id });
  return row;
}

export async function updateLenderStatus(
  lenderId: string,
  nextStatus: string,
  actorUserId: string | null,
  notesPatch?: string | null
) {
  const lender = await prisma.lecipmPipelineDealLender.findUnique({ where: { id: lenderId } });
  if (!lender) throw new Error("Lender not found");

  const to = nextStatus.slice(0, 24);
  assertForwardOrSame(lender.status, to);

  const row = await prisma.lecipmPipelineDealLender.update({
    where: { id: lenderId },
    data: {
      status: to,
      ...(notesPatch !== undefined ? { notes: notesPatch?.slice(0, 8000) ?? undefined } : {}),
    },
  });

  await appendDealAuditEvent(prisma, {
    dealId: lender.dealId,
    eventType: "LENDER_STATUS_UPDATED",
    actorUserId,
    summary: `Lender ${row.lenderName}: ${lender.status} → ${to}`,
    metadataJson: { lenderId, from: lender.status, to },
  });

  if (to === "PACKAGE_SENT") {
    await logDealCapitalTimeline(lender.dealId, "PACKAGE_SENT", `Package sent — ${row.lenderName}`);
  }

  logInfo(TAG, { lenderId, status: to });
  return row;
}

/** Convenience: advance toward PACKAGE_SENT and set PACKAGE_SENT (audited per step). */
export async function markPackageSent(lenderId: string, actorUserId: string | null) {
  let lender = await prisma.lecipmPipelineDealLender.findUnique({ where: { id: lenderId } });
  if (!lender) throw new Error("Lender not found");

  const pkgIdx = ORDER.indexOf("PACKAGE_SENT");
  while (ORDER.indexOf(lender.status as LenderStatus) < pkgIdx) {
    const curIdx = ORDER.indexOf(lender.status as LenderStatus);
    const next = ORDER[curIdx + 1];
    if (!next || next === "REJECTED") break;
    lender = (await updateLenderStatus(lender.id, next, actorUserId))!;
  }
  return lender;
}
