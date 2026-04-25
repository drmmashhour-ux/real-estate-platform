/** Serializable shape returned by GET /api/deals/[id]/closing */
export type QcClosingApiBundle = {
  closing: {
    id: string;
    dealId: string;
    status: string;
    qcClosingStage: string | null;
    signingScheduledAt: string | null;
    deedSignedAt: string | null;
    deedActNumber: string | null;
    deedPublicationReference: string | null;
    landRegisterStatus: string | null;
    landRegisterConfirmedAt: string | null;
    keysReleasedAt: string | null;
    closingPacketMarkedCompleteAt: string | null;
  } | null;
  conditions: Array<{
    id: string;
    conditionType: string;
    deadline: string | null;
    status: string;
    notes: string | null;
    fulfilledAt: string | null;
    waivedAt: string | null;
    failedAt: string | null;
  }>;
  notary: {
    notaryDisplayName: string | null;
    notaryOffice: string | null;
    notaryEmail: string | null;
    notaryPhone: string | null;
    appointmentAt: string | null;
    signingChannel: string | null;
    requestedDocumentsJson: unknown;
    deedReadinessNotes: string | null;
  } | null;
  notaryChecklist: Array<{
    id: string;
    itemKey: string;
    status: string;
    notes: string | null;
    receivedAt: string | null;
  }>;
  adjustments: Array<{
    id: string;
    kind: string;
    label: string;
    amountCents: number;
    buyerOwes: boolean;
    notes: string | null;
  }>;
  readiness: { readinessStatus: string };
  qcBlockers: string[];
  signingReadinessBlockers: string[];
  deedCompletionBlockers: string[];
  coordinationAudits: Array<{ id: string; action: string; createdAt: string; payload: unknown }>;
  closingAudits: Array<{ id: string; eventType: string; createdAt: string; note: string | null }>;
  closingPacket: { sections: Array<{ key: string; label: string; status: string; detail?: string }>; generatedAt: string };
  fundFlow: {
    rows: Array<{
      id: string;
      paymentKind: string;
      status: string;
      amountCents: number;
      currency: string;
      receivedAt: string | null;
      confirmedAt: string | null;
      releasedAt: string | null;
      provider: string;
    }>;
    counts: { deposit: number; balanceOrMortgageRelated: number; released: number };
  };
  flags: {
    qcWorkflowActive: boolean;
    notaryOk: boolean;
    checklistTerminal: boolean;
    packetMarkedComplete: boolean;
  };
};
