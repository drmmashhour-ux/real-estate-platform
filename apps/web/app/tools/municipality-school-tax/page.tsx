import type { Metadata } from "next";
import { ToolShell } from "@/components/tools/ToolShell";
import { MunicipalitySchoolTaxClient } from "./MunicipalitySchoolTaxClient";

export const metadata: Metadata = {
  title: "Municipality & school tax estimator",
  description:
    "Estimate annual municipal and school property taxes from your assessment and rates per $100 (Québec-style tax bills).",
};

export default function MunicipalitySchoolTaxPage() {
  return (
    <ToolShell
      title="Municipality & school tax"
      subtitle="Enter your roll value and rates from your tax bill — estimates only, not tax advice."
    >
      <MunicipalitySchoolTaxClient />
    </ToolShell>
  );
}
