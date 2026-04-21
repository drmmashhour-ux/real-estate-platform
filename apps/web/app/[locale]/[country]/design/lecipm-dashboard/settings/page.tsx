import type { Metadata } from "next";

import { SettingsPlaceholder } from "@/components/lecipm-dashboard-mock/pages/SettingsPlaceholder";

export const metadata: Metadata = {
  title: "LECIPM UI · Settings (mock)",
  robots: { index: false, follow: false },
};

export default function SettingsMockPage() {
  return <SettingsPlaceholder />;
}
