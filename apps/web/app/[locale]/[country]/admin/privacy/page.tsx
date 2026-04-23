import { Metadata } from "next";
import { PrivacyDashboard } from "@/modules/privacy/components/PrivacyDashboard";

export const metadata: Metadata = {
  title: "Privacy & Compliance | Admin",
  description: "Monitor Law 25 and OACIQ compliance metrics.",
};

export default function AdminPrivacyPage() {
  return <PrivacyDashboard />;
}
