import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { canAccessContract, getContractForAccess, resolveListingOwnerId } from "@/modules/contracts/services/access";
import { E_SIGN_CONTRACT_TYPES } from "@/lib/hubs/contract-types";
import { contractToPdfPayload } from "@/modules/contracts/services/pdf-payload";
import { ContractPdfDocument } from "@/lib/pdf/contract-pdf";
import { appendContractAuditLog } from "@/lib/legal/enforceable-contract";

/**
 * Shared PDF bytes for GET /api/contracts/[id]/pdf and /download.
 */
export async function buildContractPdfBufferForUser(params: {
  contractId: string;
  userId: string;
  userRole: string | null;
  /** Record `pdf_download` in `LegalContractAuditLog` (use for explicit download endpoint). */
  auditDownload?: boolean;
}): Promise<{ buffer: Buffer; filename: string } | { error: string; status: number }> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { role: true },
  });
  if (!user) {
    return { error: "User not found", status: 401 };
  }

  const c = await getContractForAccess(params.contractId);
  if (!c || !E_SIGN_CONTRACT_TYPES.has(c.type)) {
    return { error: "Not found", status: 404 };
  }

  const listingOwnerId = await resolveListingOwnerId(c);
  if (!canAccessContract(params.userId, user.role, c, listingOwnerId)) {
    return { error: "Forbidden", status: 403 };
  }

  const payload = contractToPdfPayload(c);
  const safeName = (c.title || "contract").replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 48);

  try {
    const buf = await renderToBuffer(
      React.createElement(ContractPdfDocument, {
        title: payload.title,
        reference: c.id.slice(0, 12).toUpperCase(),
        bodyText: payload.htmlExcerpt,
        signatures: payload.signatures,
        legalNotice: payload.legalNotice,
      }) as Parameters<typeof renderToBuffer>[0]
    );
    if (params.auditDownload) {
      void appendContractAuditLog({
        contractId: c.id,
        userId: params.userId,
        action: "pdf_download",
        ipAddress: null,
        version: c.version ?? null,
      });
    }
    return { buffer: Buffer.from(buf), filename: `lecipm-contract-${safeName}.pdf` };
  } catch (e) {
    console.error("[contracts/pdf]", e);
    return { error: "PDF generation failed", status: 500 };
  }
}
