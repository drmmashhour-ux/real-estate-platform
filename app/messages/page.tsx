"use client";

import { FormEvent, useState } from "react";

import { buildAssistantReply } from "@/lib/messageIntent";

export default function MessagesPage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReply(buildAssistantReply(message));
  }

  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Messages
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Account assistant
          </h1>
          <p className="mt-3 text-sm text-slate-400 sm:text-base">
            Send a message like{" "}
            <span className="font-medium text-slate-200">
              i want renew my plan
            </span>{" "}
            and we&apos;ll guide you.
          </p>
        </div>
      </section>

      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/50 sm:p-6"
          >
            <div>
              <label
                htmlFor="message"
                className="mb-1.5 block text-xs font-medium text-slate-200"
              >
                Your message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                placeholder="Type your request..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                required
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Send
            </button>
          </form>

          {reply ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-sm text-emerald-100 sm:text-base">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Assistant reply
              </p>
              <p className="mt-2">{reply}</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}