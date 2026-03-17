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
}: Props) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

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
              {s.step_name.replace(/_/g, " ")} · {s.status}
            </li>
          ))}
        </ul>
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
