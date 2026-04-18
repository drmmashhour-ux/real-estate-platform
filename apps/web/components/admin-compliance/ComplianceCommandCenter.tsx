import type { ComplianceCommandCenterPayload } from "@/modules/compliance-admin/compliance-command-center.service";
import { ComplianceCommandCenterView } from "./ComplianceCommandCenterView";

export function ComplianceCommandCenter(props: {
  data: ComplianceCommandCenterPayload;
  navActive: "/admin/compliance" | "/admin/compliance/cases" | "/admin/compliance/reviews" | "/admin/compliance/analytics";
  mode: "overview" | "cases" | "reviews" | "analytics";
}) {
  return <ComplianceCommandCenterView {...props} />;
}
