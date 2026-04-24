import type { ReactNode } from "react";

import { Card } from "@/components/lecipm-ui/card";

export function DealPanel({
  score,
  probability,
  riskLevel,
  title = "Deal Intelligence",
  footer,
}: {
  score: number | string;
  probability: number | string;
  riskLevel?: string;
  title?: string;
  footer?: ReactNode;
}) {
  return (
    <Card>
      <div className="mb-2 text-xl font-semibold text-white">{title}</div>
      <div className="text-neutral-400">
        Score: <span className="font-semibold text-[#D4AF37]">{score}</span>
      </div>
      <div className="mt-1 text-neutral-400">
        Close probability:{" "}
        <span className="font-semibold text-white">{typeof probability === "number" ? `${probability}%` : probability}</span>
      </div>
      {riskLevel ? (
        <div className="mt-2 text-sm text-neutral-500">
          Risk level: <span className="text-neutral-200">{riskLevel}</span>
        </div>
      ) : null}
      {footer}
    </Card>
  );
}
