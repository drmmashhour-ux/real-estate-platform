import { prisma } from "@/lib/db";

/** Thrown when a case cannot proceed due to non-final negotiation state (approval / signature gates). */
export class NegotiationGateError extends Error {
  readonly httpStatus = 409;
  constructor(message: string) {
    super(message);
    this.name = "NegotiationGateError";
  }
}
import {
  getCurrentActiveVersion,
  resolveNegotiationChainForListingCase,
} from "@/src/modules/negotiation-chain-engine/application/negotiationChainService";

async function gateNegotiationForCaseDocument(documentId: string): Promise<
  { ok: true; negotiationVersionId: string | null } | { ok: false; status: number; message: string }
> {
  const doc = await prisma.sellerDeclarationDraft.findUnique({
    where: { id: documentId },
    select: { listingId: true },
  });
  if (!doc) return { ok: false, status: 404, message: "Document not found" };

  const chain = await resolveNegotiationChainForListingCase(doc.listingId, documentId);

  if (!chain) {
    return { ok: true, negotiationVersionId: null };
  }

  const active = await getCurrentActiveVersion(chain.id);
  if (!active) {
    return {
      ok: false,
      status: 409,
      message:
        "Negotiation chain has no active version. Resolve or accept an offer version before continuing.",
    };
  }

  if (active.status !== "accepted" || !active.isFinal) {
    return {
      ok: false,
      status: 409,
      message:
        "Negotiation terms are not final. Accept the current offer version in the negotiation chain before signature or approval steps.",
    };
  }

  return { ok: true, negotiationVersionId: active.id };
}

/**
 * When a negotiation chain exists for this case, signing is allowed only if the active version
 * is the final accepted one (structured record — not a substitute for notarial act).
 */
export async function assertNegotiationSignatureAllowed(documentId: string): Promise<
  { ok: true; negotiationVersionId: string | null } | { ok: false; status: number; message: string }
> {
  return gateNegotiationForCaseDocument(documentId);
}

/** Same negotiation truth as signature: no approval while a non-final version is active on file. */
export async function assertNegotiationApprovalAllowed(documentId: string): Promise<
  { ok: true; negotiationVersionId: string | null } | { ok: false; status: number; message: string }
> {
  const r = await gateNegotiationForCaseDocument(documentId);
  if (!r.ok) {
    return {
      ok: false,
      status: r.status,
      message:
        "Cannot approve while negotiation has an open or non-final offer version. Accept a final version in the negotiation chain first.",
    };
  }
  return r;
}
