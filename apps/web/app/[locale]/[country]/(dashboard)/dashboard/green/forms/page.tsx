import { GreenFormsAssistantClient } from "@/components/green/GreenFormsAssistantClient";

export const dynamic = "force-dynamic";

export default function GreenFormsAssistantPage() {
  return (
    <main className="dashboard-shell min-h-screen bg-[#0D0D0D]">
      <GreenFormsAssistantClient />
    </main>
  );
}
