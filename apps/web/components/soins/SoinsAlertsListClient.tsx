"use client";

import { AlertCard } from "@/components/soins/AlertCard";

export function SoinsAlertsListClient(props: {
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    createdAt: Date | string;
  }>;
  actionLabel?: string;
  makeActionHref?: (id: string) => string;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      {props.alerts.length === 0 ? (
        <p className="text-center text-lg text-white/45">Aucune alerte pour le moment.</p>
      ) : (
        props.alerts.map((a) => (
          <AlertCard
            key={a.id}
            id={a.id}
            title={a.type}
            message={a.message}
            severity={a.severity}
            createdAt={a.createdAt}
            actionLabel={props.actionLabel}
            actionHref={props.makeActionHref?.(a.id)}
          />
        ))
      )}
    </div>
  );
}
