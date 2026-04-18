import type { SignatureProviderAdapter } from "../signature-provider.interface";

/** In-person / wet signature — platform tracks status only. */
export const manualSignatureAdapter: SignatureProviderAdapter = {
  providerId: "manual",
  async createSession(req) {
    return {
      providerSessionId: `manual-${req.sessionId}`,
      message: "Manual signature path — broker coordinates physical signing.",
    };
  },
};
