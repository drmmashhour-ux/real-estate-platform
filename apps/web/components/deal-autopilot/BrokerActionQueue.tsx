import type { NextBestAction } from "@/modules/deal-autopilot/deal-autopilot.types";
import { DealAutopilotCard } from "./DealAutopilotCard";

export function BrokerActionQueue({ actions }: { actions: NextBestAction[] }) {
  if (actions.length === 0) {
    return <p className="text-sm text-ds-text-secondary">No queued actions.</p>;
  }
  return (
    <ol className="space-y-3">
      {actions.map((a) => (
        <DealAutopilotCard key={a.id} action={a} />
      ))}
    </ol>
  );
}
