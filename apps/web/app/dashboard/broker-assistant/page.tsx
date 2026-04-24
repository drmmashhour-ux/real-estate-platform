import { Suspense } from "react";
import BrokerAssistantDashboardClient from "@/app/dashboard/broker-assistant/BrokerAssistantDashboardClient";

export default function BrokerAssistantDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Chargement de l’assistant…</div>}>
      <BrokerAssistantDashboardClient />
    </Suspense>
  );
}
