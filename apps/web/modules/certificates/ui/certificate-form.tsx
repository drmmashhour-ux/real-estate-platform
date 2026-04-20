"use client";

import { useState } from "react";

import { IMMOVABLE_CERTIFICATE_DISCLAIMER_EN } from "../lib/disclaimer";
import { buildDraftCertificatePayload } from "../lib/build-draft-certificate";

export default function CertificateForm() {
  const [data, setData] = useState<{ syndicateName?: string; buildingAddress?: string }>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");

  return (
    <div className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-xl font-semibold">Create Certificate</h1>

      <p className="rounded-md border border-amber-800/50 bg-amber-950/30 p-3 text-sm leading-relaxed text-amber-100/95">
        {IMMOVABLE_CERTIFICATE_DISCLAIMER_EN}
      </p>

      <input
        className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        placeholder="Syndicate Name"
        value={data.syndicateName ?? ""}
        onChange={(e) => setData({ ...data, syndicateName: e.target.value })}
      />

      <input
        className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        placeholder="Building Address"
        value={data.buildingAddress ?? ""}
        onChange={(e) => setData({ ...data, buildingAddress: e.target.value })}
      />

      <button
        type="button"
        className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50"
        disabled={status === "loading"}
        onClick={async () => {
          setStatus("loading");
          try {
            const payload = buildDraftCertificatePayload({
              syndicateName: data.syndicateName?.trim() ?? "",
              buildingAddress: data.buildingAddress?.trim() ?? "",
            });
            console.log("[certificate:create]", payload.id);
            const res = await fetch("/api/certificate/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setStatus("done");
          } catch {
            setStatus("error");
          }
        }}
      >
        Generate Certificate
      </button>

      {status === "done" ? <p className="text-sm text-emerald-400">Saved.</p> : null}
      {status === "error" ? <p className="text-sm text-rose-400">Request failed.</p> : null}
    </div>
  );
}
