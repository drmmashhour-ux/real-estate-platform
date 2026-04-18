/**
 * Broker acquisition copy — deterministic generator wrapper.
 */
import { generateGrowthContentDrafts } from "./growth-content.service";

export function brokerAcquisitionDrafts(city: string) {
  return generateGrowthContentDrafts({
    audience: "buyer",
    city,
    campaignGoal: "awareness",
    tone: "modern",
    offerType: "broker_workspace",
  });
}
