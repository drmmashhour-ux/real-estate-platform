import type { SignatureProviderAdapter } from "../signature-provider.interface";

/** Stub — Adobe Acrobat Sign integration pending. */
export const adobeSignAdapter: SignatureProviderAdapter = {
  providerId: "adobe_sign",
  async createSession() {
    return { message: "Adobe Sign adapter not configured — stub only." };
  },
};
