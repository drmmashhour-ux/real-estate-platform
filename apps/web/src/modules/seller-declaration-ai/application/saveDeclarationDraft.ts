import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { saveDeclarationDraftRow } from "@/src/modules/seller-declaration-ai/infrastructure/declarationRepository";
import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";
import { DeclarationDraftStatus } from "@/src/modules/seller-declaration-ai/domain/declaration.enums";

export async function saveDeclarationDraft(args: {
  draftId?: string;
  listingId: string;
  sellerUserId?: string | null;
  adminUserId?: string | null;
  payload: Record<string, unknown>;
}) {
  const validation = runDeclarationValidationDeterministic(args.payload);
  const status = validation.isValid ? DeclarationDraftStatus.READY : DeclarationDraftStatus.DRAFT;
  const row = await saveDeclarationDraftRow({
    draftId: args.draftId,
    listingId: args.listingId,
    sellerUserId: args.sellerUserId,
    adminUserId: args.adminUserId,
    status,
    draftPayload: args.payload,
    validationSummary: validation as unknown as Record<string, unknown>,
  });

  captureServerEvent(args.adminUserId ?? args.sellerUserId ?? "unknown", "declaration_validation_run", {
    draftId: row.id,
    isValid: validation.isValid,
    completenessPercent: validation.completenessPercent,
  });

  if (status === DeclarationDraftStatus.READY) {
    captureServerEvent(args.adminUserId ?? args.sellerUserId ?? "unknown", "declaration_ready_for_review", { draftId: row.id });
  }

  return { row, validation };
}
