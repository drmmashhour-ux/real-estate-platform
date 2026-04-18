export type BrokerSourcePlatform =
  | "instagram"
  | "linkedin"
  | "facebook"
  | "google_maps"
  | "brokerage_websites";

export type BrokerSourceInstruction = {
  platform: BrokerSourcePlatform;
  title: string;
  steps: string[];
  searchQueries: string[];
};
