import { oaciqMapperFlags } from "@/config/feature-flags";

export type ProviderEnvStatus = {
  docusignConfigured: boolean;
  pandadocConfigured: boolean;
  adobeSignConfigured: boolean;
};

export function getSignatureProviderEnvStatus(): ProviderEnvStatus {
  return {
    docusignConfigured: Boolean(process.env.DOCUSIGN_INTEGRATION_KEY),
    pandadocConfigured: Boolean(process.env.PANDADOC_API_KEY),
    adobeSignConfigured: Boolean(process.env.ADOBE_SIGN_CLIENT_ID),
  };
}

export function isOaciqBridgeActive(): boolean {
  return oaciqMapperFlags.oaciqExecutionBridgeV1;
}
