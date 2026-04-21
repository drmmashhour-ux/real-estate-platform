import type { Metadata } from "next";

import { Card } from "@/components";

export const metadata: Metadata = {
  title: "Settings · LECIPM Console",
};

export default function LecipmConsoleSettingsPage() {
  return (
    <div className="text-white">
      <h1 className="mb-4 text-2xl font-bold">Settings</h1>
      <Card className="text-neutral-400">Workspace preferences placeholder — syndication defaults, AI intensity, notifications.</Card>
    </div>
  );
}
