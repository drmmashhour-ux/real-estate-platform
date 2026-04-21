"use client";

import * as React from "react";

export default function ExecutiveTasksPage() {
  const [tasks, setTasks] = React.useState<Array<{ id: string; title: string; status: string; priority: string }>>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/agents/tasks", { credentials: "include" });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "Failed");
        setTasks(Array.isArray(j.tasks) ? j.tasks : []);
      } catch {
        setErr("Could not load tasks.");
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Executive tasks</h1>
      {err ?
        <p className="text-sm text-destructive">{err}</p>
      : null}
      <ul className="divide-y rounded-xl border">
        {tasks.map((t) => (
          <li key={t.id} className="px-4 py-3 text-sm">
            <span className="font-medium">{t.title}</span>
            <span className="ml-2 text-muted-foreground">
              {t.priority} · {t.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
