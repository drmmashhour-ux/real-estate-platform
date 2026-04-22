"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PortfolioOsCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        const res = await fetch("/api/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErr(typeof data.error === "string" ? data.error : await res.text());
          return;
        }
        setName("");
        router.refresh();
      }}
    >
      <input
        className="rounded border px-2 py-1 text-sm"
        placeholder="Portfolio name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button type="submit" className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground">
        Create portfolio
      </button>
      {err ?
        <span className="text-sm text-destructive">{err}</span>
      : null}
    </form>
  );
}
