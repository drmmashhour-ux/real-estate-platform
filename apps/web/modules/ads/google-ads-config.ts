/**
 * Public env keys only — no secrets. Values are read at runtime on the client via `process.env.NEXT_PUBLIC_*`.
 */
export const GOOGLE_ADS_PUBLIC_ENV = {
  MEASUREMENT_OR_ADS_ID: "NEXT_PUBLIC_GOOGLE_ADS_ID",
  GA4_ID: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  CONV_SIGNUP: "NEXT_PUBLIC_GOOGLE_ADS_CONV_SIGNUP",
  CONV_BOOKING: "NEXT_PUBLIC_GOOGLE_ADS_CONV_BOOKING",
} as const;
