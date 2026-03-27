const log =
  process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENV === "staging";

export function notifyDocumentUploaded(_p: {
  documentFileId: string;
  uploadedById: string | null;
}): void {
  if (log) {
    // eslint-disable-next-line no-console
    console.log("[document-notifications] notifyDocumentUploaded (stub)", _p.documentFileId);
  }
}

export function notifyDocumentShared(_p: {
  documentFileId: string;
  visibility: string;
}): void {
  if (log) {
    // eslint-disable-next-line no-console
    console.log("[document-notifications] notifyDocumentShared (stub)", _p);
  }
}

export function notifyDocumentRequested(_p: { brokerClientId: string; label: string }): void {
  if (log) {
    // eslint-disable-next-line no-console
    console.log("[document-notifications] notifyDocumentRequested (stub)", _p);
  }
}

export function notifyDocumentViewed(_p: { documentFileId: string; userId: string }): void {
  if (log) {
    // eslint-disable-next-line no-console
    console.log("[document-notifications] notifyDocumentViewed (stub)", _p.documentFileId);
  }
}
