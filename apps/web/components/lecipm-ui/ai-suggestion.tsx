import type { ReactNode } from "react";

import { Card } from "@/components/lecipm-ui/card";

export function AiSuggestion({
  message,
  title = "AI Suggestion",
  action,
}: {
  message: ReactNode;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <div className="font-semibold text-gold">{title}</div>
      <div className="mt-2 text-white">{message}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
