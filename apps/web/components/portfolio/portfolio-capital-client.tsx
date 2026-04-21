"use client";

import { useEffect, useState } from "react";

export function PortfolioCapitalClient() {
  const [json, setJson] = useState<unknown>(null);

  useEffect(() => {
    void fetch("/api/portfolio/capital-allocation", { credentials: "include" })
      .then((r) => r.json())
      .then(setJson)
      .catch(() => setJson({ error: "failed" }));
  }, []);

  return (
    <pre className="max-h-[560px] overflow-auto rounded-xl border bg-muted/40 p-4 text-xs">
      {JSON.stringify(json, null, 2)}
    </pre>
  );
}
