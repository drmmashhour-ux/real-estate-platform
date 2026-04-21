"use client";

import * as React from "react";

export default function ExecutiveBriefingPage() {
  const [payload, setPayload] = React.useState<unknown>(null);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/agents/briefing", { credentials: "include" });
      setPayload(await res.json());
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Executive briefing</h1>
      <pre className="max-h-[70vh] overflow-auto rounded-xl border bg-muted/40 p-4 text-xs">{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}
