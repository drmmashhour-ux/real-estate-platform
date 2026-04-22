"use client";

import { useMemo, useState } from "react";

type DocRow = {
  id: string;
  documentType: string;
  title: string;
  status: string;
  versionNumber: number;
  transactionNumber: string;
  fileUrl: string | null;
  requiredForClosing: boolean;
};

type FinRow = {
  lenderName: string | null;
  approvalStatus: string;
  approvedAmount: number | null;
  interestRate: number | null;
  conditionsJson: unknown;
} | null;

type NotaryRow = {
  packageStatus: string;
  notaryName: string | null;
  notaryEmail: string | null;
  sentAt: string | null;
} | null;

type SignerWire = {
  id: string;
  role: string;
  name: string;
  email: string;
  status: string;
  signedAt: string | null;
};

type PacketWire = {
  id: string;
  status: string;
  documentId: string;
  sentAt: string | null;
  completedAt: string | null;
  signers: SignerWire[];
  document: { id: string; title: string; status: string; transactionNumber: string } | null;
};

type ComplianceWire = {
  blockingIssues: string[];
  warnings: string[];
};

export function SdTransactionWorkspace({
  transactionId,
  transactionNumber,
  initialDocs,
  initialFinancial,
  initialNotary,
  initialPackets,
  initialCompliance,
}: {
  transactionId: string;
  transactionNumber: string;
  initialDocs: DocRow[];
  initialFinancial: FinRow;
  initialNotary: NotaryRow;
  initialPackets: PacketWire[];
  initialCompliance: ComplianceWire;
}) {
  const [tab, setTab] = useState<
    "documents" | "financial" | "notary" | "signatures" | "compliance"
  >("documents");
  const apiBase = `/api/transactions/${transactionId}`;

  const financial = initialFinancial;
  const notary = initialNotary;

  const docs = useMemo(() => initialDocs, [initialDocs]);
  const packets = useMemo(() => initialPackets, [initialPackets]);
  const compliance = useMemo(() => initialCompliance, [initialCompliance]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {(
          ["documents", "financial", "notary", "signatures", "compliance"] as const
        ).map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded px-3 py-1 text-sm capitalize ${tab === t ? "bg-muted font-medium" : "text-muted-foreground"}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "documents" ?
        <section className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Every file carries <span className="font-mono">{transactionNumber}</span>.
          </p>
          <ul className="space-y-2">
            {docs.map((d) => (
              <li key={d.id} className="rounded border p-2">
                <div className="font-medium">{d.title}</div>
                <div className="text-xs text-muted-foreground">
                  {d.documentType} · v{d.versionNumber} · {d.status} · required:{" "}
                  {d.requiredForClosing ? "yes" : "no"}
                </div>
                <div className="font-mono text-xs">{d.transactionNumber}</div>
                {d.fileUrl ?
                  <a className="text-primary underline" href={d.fileUrl} target="_blank" rel="noreferrer">
                    Open file
                  </a>
                : null}
              </li>
            ))}
          </ul>
          <DocumentActions apiBase={apiBase} />
        </section>
      : null}

      {tab === "financial" ?
        <section className="space-y-2 text-sm">
          {financial ?
            <>
              <p>Lender: {financial.lenderName ?? "—"}</p>
              <p>Status: {financial.approvalStatus}</p>
              <p>Amount: {financial.approvedAmount ?? "—"}</p>
              <p>Rate: {financial.interestRate ?? "—"}</p>
              <pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(financial.conditionsJson ?? {}, null, 2)}
              </pre>
            </>
          : <p className="text-muted-foreground">No financial record yet.</p>}
          <FinancialForm apiBase={apiBase} />
        </section>
      : null}

      {tab === "notary" ?
        <section className="space-y-2 text-sm">
          {notary ?
            <>
              <p>Status: {notary.packageStatus}</p>
              <p>Notary: {notary.notaryName ?? "—"}</p>
              <p>Email: {notary.notaryEmail ?? "—"}</p>
              <p>Sent: {notary.sentAt ?? "—"}</p>
            </>
          : <p className="text-muted-foreground">No notary package yet.</p>}
          <NotaryActions apiBase={apiBase} />
        </section>
      : null}

      {tab === "signatures" ?
        <section className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Internal signing workflow — invitations can be wired to email later.
          </p>
          {packets.length === 0 ?
            <p>No signature packets.</p>
          : <ul className="space-y-3">
              {packets.map((p) => (
                <li key={p.id} className="rounded border p-3">
                  <div className="font-medium">
                    Packet {p.id.slice(0, 8)}… · {p.status}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Doc: {p.document?.title ?? p.documentId} ({p.document?.status})
                  </div>
                  <ul className="mt-2 space-y-1 border-t pt-2">
                    {p.signers.map((s) => (
                      <li key={s.id} className="flex flex-wrap gap-2 text-xs">
                        <span className="font-medium">{s.role}</span>
                        <span>{s.name}</span>
                        <span className="text-muted-foreground">{s.email}</span>
                        <span className="rounded bg-muted px-1">{s.status}</span>
                        {s.signedAt ?
                          <span className="text-muted-foreground">{s.signedAt}</span>
                        : null}
                        {(s.status === "SENT" || s.status === "VIEWED") ?
                          <span className="flex gap-1">
                            <button
                              type="button"
                              className="rounded border px-1"
                              onClick={() =>
                                void fetch(`/api/signatures/${s.id}/view`, {
                                  method: "POST",
                                  credentials: "include",
                                }).then(() => window.location.reload())
                              }
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="rounded border border-primary px-1 text-primary"
                              onClick={() =>
                                void fetch(`/api/signatures/${s.id}/sign`, {
                                  method: "POST",
                                  credentials: "include",
                                }).then(() => window.location.reload())
                              }
                            >
                              Sign
                            </button>
                          </span>
                        : null}
                      </li>
                    ))}
                  </ul>
                  {p.status === "DRAFT" ?
                    <button
                      type="button"
                      className="mt-2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground"
                      onClick={() =>
                        void fetch(`/api/signatures/${p.id}/send`, {
                          method: "POST",
                          credentials: "include",
                        }).then(() => window.location.reload())
                      }
                    >
                      Send packet
                    </button>
                  : null}
                </li>
              ))}
            </ul>
          }
          <SignatureHints apiBase={apiBase} />
        </section>
      : null}

      {tab === "compliance" ?
        <section className="space-y-2 text-sm">
          <div>
            <h3 className="font-medium text-destructive">Blocking</h3>
            {compliance.blockingIssues.length === 0 ?
              <p className="text-muted-foreground">None.</p>
            : <ul className="list-inside list-disc">
                {compliance.blockingIssues.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            }
          </div>
          <div>
            <h3 className="font-medium">Warnings</h3>
            {compliance.warnings.length === 0 ?
              <p className="text-muted-foreground">None.</p>
            : <ul className="list-inside list-disc">
                {compliance.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            }
          </div>
          <p className="text-xs text-muted-foreground">
            Closing runs the same evaluation server-side (Phase 2 + Phase 3 gates).
          </p>
        </section>
      : null}

      <CloseAction apiBase={apiBase} />
    </div>
  );
}

function SignatureHints({ apiBase }: { apiBase: string }) {
  return (
    <div className="rounded border p-3 text-xs text-muted-foreground">
      Create packet: POST <code className="rounded bg-muted px-1">{apiBase}/signatures</code> with{" "}
      <code>{`{"action":"create","documentId":"..."}`}</code>, then{" "}
      <code>{`{"action":"addSigner","packetId":"...","role":"BUYER","name":"...","email":"..."}`}</code>.
      Send: POST <code className="rounded bg-muted px-1">/api/signatures/[packetId]/send</code>.
    </div>
  );
}

function DocumentActions({ apiBase }: { apiBase: string }) {
  return (
    <div className="flex flex-col gap-2 rounded border p-3 text-xs">
      <span className="font-medium">Quick actions (API-backed)</span>
      <p>
        POST <code className="rounded bg-muted px-1">{apiBase}/documents</code> with JSON actions:{" "}
        <code>draft</code>, <code>generate</code>, <code>upload</code>, <code>status</code>.
      </p>
    </div>
  );
}

function FinancialForm({ apiBase }: { apiBase: string }) {
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const approvalStatus = String(fd.get("approvalStatus") ?? "");
    const lenderName = String(fd.get("lenderName") ?? "");
    const approvedAmount = fd.get("approvedAmount") ? Number(fd.get("approvedAmount")) : null;
    const interestRate = fd.get("interestRate") ? Number(fd.get("interestRate")) : null;
    await fetch(apiBase + "/financial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        approvalStatus,
        lenderName: lenderName || null,
        approvedAmount,
        interestRate,
        conditionsJson: [{ label: "Sample condition", fulfilled: true }],
      }),
    });
    window.location.reload();
  }

  return (
    <form className="grid max-w-md gap-2 border-t pt-3" onSubmit={submit}>
      <label className="text-xs">
        Status
        <select name="approvalStatus" className="mt-1 block w-full rounded border px-2 py-1" required>
          <option value="PENDING">PENDING</option>
          <option value="PRE_APPROVED">PRE_APPROVED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </label>
      <label className="text-xs">
        Lender
        <input name="lenderName" className="mt-1 block w-full rounded border px-2 py-1" />
      </label>
      <label className="text-xs">
        Approved amount
        <input name="approvedAmount" type="number" step="0.01" className="mt-1 block w-full rounded border px-2 py-1" />
      </label>
      <label className="text-xs">
        Interest rate
        <input name="interestRate" type="number" step="0.001" className="mt-1 block w-full rounded border px-2 py-1" />
      </label>
      <button type="submit" className="rounded bg-primary px-3 py-1 text-primary-foreground">
        Save financial
      </button>
    </form>
  );
}

function NotaryActions({ apiBase }: { apiBase: string }) {
  async function prepare() {
    await fetch(apiBase + "/notary/prepare", { method: "POST", credentials: "include" });
    window.location.reload();
  }
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch(apiBase + "/notary/send", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notaryName: fd.get("notaryName"),
        notaryEmail: fd.get("notaryEmail"),
      }),
    });
    window.location.reload();
  }

  return (
    <div className="space-y-2 border-t pt-3">
      <button type="button" className="rounded border px-3 py-1 text-xs" onClick={() => void prepare()}>
        Prepare package
      </button>
      <form className="grid max-w-md gap-2 text-xs" onSubmit={(e) => void send(e)}>
        <input name="notaryName" placeholder="Notary name" className="rounded border px-2 py-1" />
        <input name="notaryEmail" placeholder="Notary email" type="email" className="rounded border px-2 py-1" />
        <button type="submit" className="rounded bg-primary px-3 py-1 text-primary-foreground">
          Send package
        </button>
      </form>
    </div>
  );
}

function CloseAction({ apiBase }: { apiBase: string }) {
  async function close() {
    const res = await fetch(apiBase + "/close", { method: "POST", credentials: "include" });
    const j = (await res.json()) as { reasons?: string[]; ok?: boolean };
    if (!res.ok) {
      alert(j.reasons?.join("\n") ?? "Cannot close");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="border-t pt-4">
      <button
        type="button"
        className="rounded border border-destructive px-3 py-1 text-destructive"
        onClick={() => void close()}
      >
        Attempt close (Phase 2–3 gates)
      </button>
    </div>
  );
}
