"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  type AccountState,
  processAccountMessage,
} from "@/lib/accountAssistant";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

const INITIAL_STATE: AccountState = {
  planName: "Basic Plan",
  planRevision: 1,
  balance: 0,
};

export default function MessagesPage() {
  const [input, setInput] = useState("");
  const [accountState, setAccountState] = useState<AccountState>(INITIAL_STATE);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hi! I can update your plan, add funds, and show your current balance.",
    },
  ]);

  const balanceLabel = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(accountState.balance),
    [accountState.balance]
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const userMessage = input.trim();
    if (!userMessage) {
      return;
    }

    const result = processAccountMessage(userMessage, accountState);

    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, role: "user", text: userMessage },
      { id: prev.length + 2, role: "assistant", text: result.reply },
    ]);
    setAccountState(result.nextState);
    setInput("");
  };

  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Messages
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Plan and Funds Assistant
          </h1>
          <p className="mt-3 text-sm text-slate-400 sm:text-base">
            Type naturally (even with typos), for example:
            <span className="block mt-1 text-slate-300">
              &quot;i update my plann , and also asking to addd money i add
              100$ so what we have now&quot;
            </span>
          </p>
        </div>
      </section>

      <section className="bg-slate-950/90">
        <div className="mx-auto grid max-w-4xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200 shadow-lg shadow-slate-950/40 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>
                <span className="text-slate-400">Plan:</span>{" "}
                <span className="font-medium text-slate-100">
                  {accountState.planName} (v{accountState.planRevision})
                </span>
              </p>
              <p>
                <span className="text-slate-400">Balance:</span>{" "}
                <span className="font-semibold text-emerald-300">
                  {balanceLabel}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/40 sm:p-5">
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-sm ${
                    message.role === "assistant"
                      ? "bg-slate-800 text-slate-100"
                      : "ml-auto bg-emerald-500 text-slate-950"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <form onSubmit={onSubmit} className="mt-4 flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Update my plan and add $100. What's my balance now?"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              />
              <button
                type="submit"
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}