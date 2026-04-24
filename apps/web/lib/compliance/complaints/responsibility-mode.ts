export type ComplaintResponsibilityMode = "self_managed_compliance" | "agency_managed_compliance";

export function getComplaintResponsibilityMode(mode: "agency" | "solo_broker"): ComplaintResponsibilityMode {
  return mode === "solo_broker" ? "self_managed_compliance" : "agency_managed_compliance";
}
