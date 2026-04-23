/**
 * Global financial invariants — trust separation, registry completeness, tax identifier exposure.
 */

export function assertTrustFundsClassification(receivedForType: string, fundsDestinationType: string): void {
  if (receivedForType === "trust_deposit" && fundsDestinationType !== "trust") {
    throw new Error("TRUST_FUNDS_MISCLASSIFIED");
  }
}

/** Trust account funds must not be booked as brokerage/platform revenue or commission. */
export function assertTrustFundsCannotBeRevenue(fundsSource?: string | null, action?: string | null): void {
  if (fundsSource === "trust" && action === "revenue") {
    throw new Error("TRUST_FUNDS_CANNOT_BE_REVENUE");
  }
}

export function assertTaxRecordRequired(taxRecord: unknown): void {
  if (!taxRecord) {
    throw new Error("TAX_RECORD_REQUIRED");
  }
}

export function assertCommissionHasTaxRecord(commissionTotalCents: number | null | undefined, taxRecordCreated: boolean): void {
  if (commissionTotalCents != null && commissionTotalCents > 0 && !taxRecordCreated) {
    throw new Error("TAX_RECORD_REQUIRED");
  }
}

export function assertCompletedTransactionHasRegistryRecord(
  transactionCompleted: boolean,
  transactionRecordCreated: boolean,
): void {
  if (transactionCompleted && !transactionRecordCreated) {
    throw new Error("TRANSACTION_RECORD_REQUIRED");
  }
}

export function assertBrokerUiDoesNotExposeRawTaxIdentifiers(viewerIsBroker: boolean, payloadContainsRawAccountFields: boolean): void {
  const attemptExposeRawTaxAccountNumberToBrokerUIWithoutPermission =
    viewerIsBroker && payloadContainsRawAccountFields;
  if (attemptExposeRawTaxAccountNumberToBrokerUIWithoutPermission) {
    throw new Error("RAW_TAX_IDENTIFIER_EXPOSURE_FORBIDDEN");
  }
}
