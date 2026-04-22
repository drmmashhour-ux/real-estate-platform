"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ClosingRow = {
  closingStatus: string;
  closingDate: Date | null;
  notaryName: string | null;
  notaryEmail: string | null;
  checklistItems: { id: string; label: string; status: string; isCritical: boolean }[];
  closingDocuments: { id: string; title: string; docType: string; status: string }[];
};

export function ClosingRoomClient({
  dealId,
  initialClosing,
  initialValidation,
  baseBack,
}: {
  dealId: string;
  initialClosing: ClosingRow | null;
  initialValidation: { status: string; issues: string[] } | null;
  baseBack: string;
}) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [validation, setValidation] = useState(initialValidation);

  async function runValidation() {
    setErr(null);
    const res = await fetch(`/api/deals/${dealId}/closing/validate`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) setErr(data.error ?? await res.text());
    else setValidation(data);
  }

  return (
    <div className="space-y-8 text-sm">
      {err ?
        <p className="text-destructive">{err}</p>
      : null}

      <section>
        <h2 className="font-medium">Overview</h2>
        {initialClosing ?
          <div className="mt-2 space-y-1 font-mono text-xs">
            <div>Status: {initialClosing.closingStatus}</div>
            <div>
              Closing date:{" "}
              {initialClosing.closingDate ?
                initialClosing.closingDate.toISOString().slice(0, 10)
              : "—"}
            </div>
            <div>
              Notary: {initialClosing.notaryName ?? "—"} · {initialClosing.notaryEmail ?? ""}
            </div>
          </div>
        : <p className="text-muted-foreground text-xs">Not initialized — use Init below.</p>}
      </section>

      <section className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={async () => {
            setErr(null);
            const res = await fetch(`/api/deals/${dealId}/closing/init`, { method: "POST" });
            if (!res.ok) setErr(await res.text());
            else router.refresh();
          }}
        >
          Initialize closing
        </button>
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => runValidation()}>
          Run validation
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={async () => {
            setErr(null);
            const res = await fetch(`/api/deals/${dealId}/closing/document`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mode: "import" }),
            });
            if (!res.ok) setErr(await res.text());
            else router.refresh();
          }}
        >
          Import signed TX docs
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={async () => {
            setErr(null);
            const res = await fetch(`/api/deals/${dealId}/closing/complete`, { method: "POST" });
            if (!res.ok) setErr(await res.text());
            else router.refresh();
          }}
        >
          Complete closing
        </button>
      </section>

      <section>
        <h2 className="font-medium">Validation</h2>
        {validation ?
          <div className="mt-2 text-xs">
            <p>
              <span className="font-semibold">{validation.status}</span>
            </p>
            <ul className="mt-1 list-inside list-disc">
              {validation.issues?.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>
        : null}
      </section>

      <section>
        <h2 className="font-medium">Checklist</h2>
        <ul className="mt-2 space-y-2 text-xs">
          {initialClosing?.checklistItems?.map((it) => (
            <li key={it.id} className="flex flex-wrap items-center gap-2">
              <span>
                [{it.status}] {it.label}
              </span>
              <button
                type="button"
                className="underline"
                onClick={async () => {
                  setErr(null);
                  const res = await fetch(`/api/deals/${dealId}/closing/checklist`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ itemId: it.id, status: "DONE" }),
                  });
                  if (!res.ok) setErr(await res.text());
                  else router.refresh();
                }}
              >
                Mark done
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Documents</h2>
        <ul className="mt-2 space-y-2 text-xs">
          {initialClosing?.closingDocuments?.map((d) => (
            <li key={d.id} className="flex flex-wrap gap-2">
              <span>
                {d.title} · {d.docType} · {d.status}
              </span>
              <button
                type="button"
                className="underline"
                onClick={async () => {
                  setErr(null);
                  const res = await fetch(`/api/deals/${dealId}/closing/document`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mode: "verify", documentId: d.id }),
                  });
                  if (!res.ok) setErr(await res.text());
                  else router.refresh();
                }}
              >
                Verify
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Notary</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={async () => {
              setErr(null);
              const res = await fetch(`/api/deals/${dealId}/closing/notary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "assign",
                  name: "Me Notaire",
                  email: "notary@example.com",
                }),
              });
              if (!res.ok) setErr(await res.text());
              else router.refresh();
            }}
          >
            Assign notary (demo)
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={async () => {
              setErr(null);
              const res = await fetch(`/api/deals/${dealId}/closing/notary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "prepare" }),
              });
              if (!res.ok) setErr(await res.text());
              else router.refresh();
            }}
          >
            Prepare docs
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={async () => {
              setErr(null);
              const res = await fetch(`/api/deals/${dealId}/closing/notary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "send" }),
              });
              if (!res.ok) setErr(await res.text());
              else router.refresh();
            }}
          >
            Simulate send
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={async () => {
              setErr(null);
              const res = await fetch(`/api/deals/${dealId}/closing/notary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "signing" }),
              });
              if (!res.ok) setErr(await res.text());
              else router.refresh();
            }}
          >
            Signing started
          </button>
        </div>
      </section>

      <a className="text-xs text-muted-foreground underline" href={baseBack}>
        ← Back to deal
      </a>
    </div>
  );
}
