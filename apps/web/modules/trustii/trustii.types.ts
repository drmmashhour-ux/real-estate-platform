/** Trustii provider responses — extend when integrating live API. */
export type TrustiiCreditCheckStatus = "PENDING" | "SENT" | "COMPLETED" | "FAILED";

export type TrustiiProviderConfig = {
  apiBaseUrl: string;
  apiKey: string | undefined;
  simulate: boolean;
};

export type TrustiiCreateRequestResult = {
  externalRequestId: string;
  simulated: boolean;
};

export type TrustiiFetchResultPayload = {
  status: TrustiiCreditCheckStatus;
  score: number | null;
  reportUrl: string | null;
};
