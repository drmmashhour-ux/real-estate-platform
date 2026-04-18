export type ConversionFunnelKey = "listing_contact" | "bnhub_booking" | "host_onboarding" | "roi_calculator";

export type ConversionRates = {
  ctr: number;
  saveRate: number;
  inquiryRate: number;
  bookingStartRate: number;
  bookingCompleteRate: number;
};
