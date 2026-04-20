import type { Metadata } from "next";
import { LegalReferenceHub } from "@/components/legal/LegalReferenceHub";

export const metadata: Metadata = {
  title: "Legal reference hub",
  description: "LECIPM legal case library and deterministic compliance risk checklist.",
};

export default function LegalReferencePage() {
  return <LegalReferenceHub />;
}
