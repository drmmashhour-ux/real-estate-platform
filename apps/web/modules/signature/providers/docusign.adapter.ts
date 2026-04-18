import type { SignatureProviderAdapter } from "../signature-provider.interface";

/** Stub — wire DocuSign OAuth + envelopes when licensed. */
export const docusignAdapter: SignatureProviderAdapter = {
  providerId: "docusign",
  async createSession() {
    return { message: "DocuSign adapter not configured — stub only." };
  },
};
