import type { SignatureProviderId } from "./signature.types";

export type ExternalSignatureRequest = {
  dealId: string;
  sessionId: string;
  documentIds: string[];
  callbackUrl?: string;
};

export type ExternalSignatureResult = {
  providerSessionId?: string;
  message: string;
};

export interface SignatureProviderAdapter {
  readonly providerId: SignatureProviderId;
  createSession(req: ExternalSignatureRequest): Promise<ExternalSignatureResult>;
}
