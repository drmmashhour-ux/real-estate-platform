/**
 * Required positioning for Québec real-estate e-sign UX (transaction documents vs notarial act).
 * Show on envelope create, send, sign, and dashboard surfaces.
 */
export const ESIGNATURE_NOTARY_DISCLAIMER =
  "Electronic signatures on LECIPM apply to the transaction documents in this envelope only. " +
  "The deed of sale, hypothec, and land registration formalities for immovable property in Québec remain subject to notarial practice and the Chambre des notaires — this workflow does not replace the notary for title transfer.";

export const ESIGNATURE_EVIDENCE_DISCLAIMER =
  "The platform records identity steps, consent, timestamps, document integrity (hash), IP address, and user-agent where available to support an evidentiary trail. " +
  "Signed document versions are immutable once the envelope is finalized; brokers remain accountable for content and dispatch.";

export const ESIGNATURE_BROKER_APPROVAL_LINE =
  "No envelope is sent until a licensed broker on the file approves dispatch and meets platform signing-readiness checks.";
