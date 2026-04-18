import { anchorForRole } from "@/modules/signature-prep/signature-field-mapper";
import { getDocuSignAccessToken } from "./docusign.oauth";

const API_BASE = process.env.DOCUSIGN_REST_BASE ?? "https://demo.docusign.net/restapi";

export type DocuSignRecipient = {
  email: string;
  name: string;
  roleName: string;
  routingOrder: string;
  recipientId: string;
};

export type CreateEnvelopeInput = {
  accountId: string;
  emailSubject: string;
  documents: { documentId: string; name: string; base64Pdf: string }[];
  recipients: DocuSignRecipient[];
  status: "sent" | "created";
};

/**
 * Production DocuSign REST adapter — creates envelopes with embedded PDFs.
 * @see https://developers.docusign.com/docs/esign-rest-api/
 */
export async function docusignCreateEnvelope(input: CreateEnvelopeInput): Promise<{ envelopeId: string; uri?: string }> {
  const { access_token } = await getDocuSignAccessToken();

  const documents = input.documents.map((d, i) => ({
    documentBase64: d.base64Pdf,
    name: d.name,
    documentId: d.documentId || String(i + 1),
    fileExtension: "pdf",
  }));

  const signers = input.recipients.map((r) => ({
    email: r.email,
    name: r.name,
    recipientId: r.recipientId,
    routingOrder: r.routingOrder,
    tabs: {
      signHereTabs: [
        {
          anchorString: anchorForRole(r.roleName),
          anchorUnits: "pixels",
          anchorYOffset: "0",
          anchorXOffset: "0",
        },
      ],
    },
  }));

  const body = {
    emailSubject: input.emailSubject,
    documents,
    recipients: { signers },
    status: input.status,
  };

  const url = `${API_BASE}/v2.1/accounts/${input.accountId}/envelopes`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { envelopeId?: string; uri?: string; errorCode?: string; message?: string };
  if (!res.ok || !json.envelopeId) {
    throw new Error(`DocuSign create envelope failed: ${json.errorCode ?? res.status} ${json.message ?? JSON.stringify(json)}`);
  }
  return { envelopeId: json.envelopeId, uri: json.uri };
}

export async function docusignGetEnvelopeStatus(accountId: string, envelopeId: string): Promise<{ status: string }> {
  const { access_token } = await getDocuSignAccessToken();
  const url = `${API_BASE}/v2.1/accounts/${accountId}/envelopes/${envelopeId}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` } });
  const json = (await res.json()) as { status?: string };
  if (!res.ok) throw new Error(`DocuSign envelope get failed: ${res.status}`);
  return { status: json.status ?? "unknown" };
}
