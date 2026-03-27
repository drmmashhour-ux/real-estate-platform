import type { Metadata } from "next";
import { ToolShell } from "@/components/tools/ToolShell";
import { WelcomeTaxClient } from "./WelcomeTaxClient";

export const metadata: Metadata = {
  title: "Welcome tax estimator",
  description: "Estimate land transfer / welcome tax from configured municipal brackets.",
};

export default function WelcomeTaxPage() {
  return (
    <ToolShell
      title="Welcome tax estimator"
      subtitle="Uses admin-configured brackets — not legal or tax advice."
    >
      <WelcomeTaxClient />
    </ToolShell>
  );
}
