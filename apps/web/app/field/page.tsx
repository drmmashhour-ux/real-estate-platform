import type { Metadata } from "next";
import { FieldDemoClient } from "@/components/field/FieldDemoClient";

export const metadata: Metadata = {
  title: "Field Demo Team | LECIPM",
  description:
    "Tableau de bord terrain : leads courtiers, script démo, support LECI, objectifs du jour et journal de résultats.",
};

export default function FieldDemoTeamPage() {
  return <FieldDemoClient />;
}
