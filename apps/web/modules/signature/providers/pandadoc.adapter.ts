import type { SignatureProviderAdapter } from "../signature-provider.interface";

/** Stub — PandaDoc document API integration pending. */
export const pandadocAdapter: SignatureProviderAdapter = {
  providerId: "pandadoc",
  async createSession() {
    return { message: "PandaDoc adapter not configured — stub only." };
  },
};
