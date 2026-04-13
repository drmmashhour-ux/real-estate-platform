"use client";

import { useState } from "react";

type Offer = {
  id: string;
  offer_price: number;
  conditions: unknown;
  expiration_date: Date | null;
  status: string;
  counter_offers: { id: string; counter_price: number; notes: string | null; created_at: Date }[];
};

type Message = {
  id: string;
  sender_id: string;
  sender_name: string | null;
  message: string;
  created_at: Date;
};

type Deposit = { id: string; amount: number; payment_status: string };
type Document = {
  id: string;
  document_type: string;
  file_url: string;
  signed_by_buyer: boolean;
  signed_by_seller: boolean;
  signed_by_broker: boolean;
};
type Step = { id: string; step_name: string; status: string };

type Props = {
  transactionId: string;
  myRole: string;
  status: string;
  frozenByAdmin: boolean;
  offerPrice: number | null;
  offers: Offer[];
  messages: Message[];
  deposits: Deposit[];
  documents: Document[];
  steps: Step[];
  inspectionIssues?: string[];
  hasInspectionDoc?: boolean;
};

const STEP_DISPLAY_NAMES: Record<string, string> = {
  inspection: "Request inspection",
  financing_approval: "Financing approval",
  legal_review: "Legal review",
  final_payment: "Final payment",
  ownership_transfer: "Ownership transfer",
};

export function TransactionDetailClient({
  transactionId,
  myRole,
  status,
  frozenByAdmin,
  offerPrice,
  offers,
  messages,
  deposits,
  documents,
  steps,
  inspectionIssues = [],
  hasInspectionDoc = false,
}: Props) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [inspectionIssueInput, setInspectionIssueInput] = useState("");
  const [inspectionReportUrl, setInspectionReportUrl] = useState("");
  const [inspectionIssuesLocal, setInspectionIssuesLocal] = useState<string[]>(inspectionIssues);
  const [actionLoading, setActionLoading] = useState<"upload" | "issues" | "cancel" | null>(null);

  const currentStep = steps.find((s) => s.status === "pending");
  const isInspectionStep = currentStep?.step_name === "inspection" && status !== "cancelled";

  async function sendMessage() {
    const msg = newMessage.trim();
    if (!msg) return;
    setSending(true);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (res.ok) {
        setNewMessage("");
        window.location.reload();
      }
    } finally {
      setSending(false);
    }
  }

  async function uploadReportAndComplete() {
    setActionLoading("upload");
    try {
      if (inspectionReportUrl.trim()) {
        const uploadRes = await fetch(`/api/transactions/${transactionId}/upload-document`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_type: "inspection_conditions",
            file_url: inspectionReportUrl.trim(),
          }),
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          alert(err?.error ?? "Upload failed");
          return;
        }
      }
      const res = await fetch(`/api/transactions/${transactionId}/complete-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step_name: "inspection" }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setActionLoading(null);
    }
  }

  async function submitInspectionIssues() {
    const toAdd = inspectionIssueInput.trim();
    if (!toAdd) return;
    setActionLoading("issues");
    try {
      const issues = [...inspectionIssuesLocal, toAdd];
      const res = await fetch(`/api/transactions/${transactionId}/inspection-issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issues }),
      });
      if (res.ok) {
        setInspectionIssuesLocal(issues);
        setInspectionIssueInput("");
        window.location.reload();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function cancelDeal() {
    if (!confirm("Cancel this deal? This cannot be undone.")) return;
    setActionLoading("cancel");
    try {
      const res = await fetch(`/api/transactions/${transactionId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Inspection: deal cancelled by party" }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-slate-200">Offer price</h2>
        <p className="mt-1 text-slate-300">
          {offerPrice != null ? `$${(offerPrice / 100).toLocaleString()}` : "—"}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200">Offers & counters</h2>
        <ul className="mt-2 space-y-2">
          {offers.map((o) => (
            <li key={o.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-sm">
              <p className="text-slate-200">${(o.offer_price / 100).toLocaleString()} · {o.status}</p>
              {o.counter_offers.length > 0 && (
                <ul className="mt-2 ml-4 space-y-1 text-slate-400">
                  {o.counter_offers.map((c) => (
                    <li key={c.id}>Counter: ${(c.counter_price / 100).toLocaleString()} {c.notes && `· ${c.notes}`}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200">Deposits</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {deposits.length === 0 ? (
            <li>No deposits recorded.</li>
          ) : (
            deposits.map((d) => (
              <li key={d.id}>
                ${(d.amount / 100).toLocaleString()} · {d.payment_status}
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200">Documents</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center gap-2">
              <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                {d.document_type}
              </a>
              <span className="text-slate-500">
                {d.signed_by_buyer && "B"} {d.signed_by_seller && "S"} {d.signed_by_broker && "Br"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200">Closing steps</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {steps.map((s) => (
            <li key={s.id}>
              {STEP_DISPLAY_NAMES[s.step_name] ?? s.step_name.replace(/_/g, " ")} · {s.status}
            </li>
          ))}
        </ul>

        {isInspectionStep && !frozenByAdmin && (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-950/20 p-4">
            <h3 className="font-medium text-amber-200">Request inspection</h3>
            <p className="mt-1 text-sm text-slate-400">Upload report, mark issues, or cancel the deal.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
                <h4 className="text-sm font-medium text-slate-200">Upload report</h4>
                <p className="mt-1 text-xs text-slate-500">Add inspection report (paste URL) or mark complete</p>
                {hasInspectionDoc ? (
                  <p className="mt-2 text-xs text-emerald-400">Report uploaded.</p>
                ) : (
                  <input
                    type="url"
                    placeholder="Report URL (optional)"
                    className="mt-2 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500"
                    value={inspectionReportUrl}
                    onChange={(e) => setInspectionReportUrl(e.target.value)}
                  />
                )}
                <button
                  type="button"
                  onClick={uploadReportAndComplete}
                  disabled={!!actionLoading}
                  className="mt-2 w-full rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  {hasInspectionDoc ? "Mark inspection complete" : "Upload report & complete"}
                </button>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
                <h4 className="text-sm font-medium text-slate-200">Mark issues</h4>
                <p className="mt-1 text-xs text-slate-500">Record inspection issues</p>
                {inspectionIssuesLocal.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc text-xs text-slate-400">
                    {inspectionIssuesLocal.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-2 flex gap-1">
                  <input
                    type="text"
                    placeholder="Describe issue..."
                    className="flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500"
                    value={inspectionIssueInput}
                    onChange={(e) => setInspectionIssueInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitInspectionIssues()}
                  />
                  <button
                    type="button"
                    onClick={submitInspectionIssues}
                    disabled={!inspectionIssueInput.trim() || !!actionLoading}
                    className="rounded bg-slate-600 px-2 py-1 text-xs text-white hover:bg-slate-500 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
                <h4 className="text-sm font-medium text-slate-200">Cancel deal</h4>
                <p className="mt-1 text-xs text-slate-500">Walk away from the deal</p>
                <button
                  type="button"
                  onClick={cancelDeal}
                  disabled={!!actionLoading}
                  className="mt-2 w-full rounded bg-red-900/80 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-800/80 disabled:opacity-50"
                >
                  Cancel deal
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200">Messages</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {messages.map((m) => (
            <li key={m.id} className="rounded bg-slate-800/60 px-3 py-2">
              <p className="text-slate-400">{m.sender_name ?? "User"} · {new Date(m.created_at).toLocaleString()}</p>
              <p className="mt-1 text-slate-200">{m.message}</p>
            </li>
          ))}
        </ul>
        {!frozenByAdmin && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
