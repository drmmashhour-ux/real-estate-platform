"use client";

import { useState } from "react";
import { AlertsCenter } from "@/src/modules/watchlist-alerts/ui/AlertsCenter";

type Props = { initialAlerts: any[] };

export function WatchlistAlertsPreview({ initialAlerts }: Props) {
  const [alerts, setAlerts] = useState(initialAlerts);

  async function reload() {
    const res = await fetch("/api/watchlist/alerts", { cache: "no-store" }).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    setAlerts(data?.alerts ?? []);
  }

  return <AlertsCenter alerts={alerts} onChanged={reload} />;
}
