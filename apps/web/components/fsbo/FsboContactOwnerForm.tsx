"use client";

import { useState } from "react";

export function FsboContactOwnerForm({ listingId }: { listingId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErr(null);
    try {
      const res = await fetch("/api/fsbo/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, name, email, message: message || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Could not send");
        setStatus("err");
        return;
      }
      setStatus("ok");
      setMessage("");
    } catch {
      setErr("Network error");
      setStatus("err");
    }
  }

  return (
    <form id="contact" onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-[#121212] p-5">
      <h2 className="text-lg font-semibold text-white">Contact owner</h2>
      <p className="mt-1 text-xs text-[#B3B3B3]">Your message is sent to the listing owner.</p>
      <label className="mt-4 block text-xs text-[#B3B3B3]">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
        />
      </label>
      <label className="mt-3 block text-xs text-[#B3B3B3]">
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
        />
      </label>
      <label className="mt-3 block text-xs text-[#B3B3B3]">
        Message
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
        />
      </label>
      {err ? <p className="mt-2 text-sm text-red-400">{err}</p> : null}
      {status === "ok" ? (
        <p className="mt-2 text-sm text-emerald-400">Message sent — the owner will get back to you.</p>
      ) : null}
      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-4 w-full rounded-xl bg-[#C9A646] py-3 text-sm font-bold text-[#0B0B0B] hover:bg-[#E8C547] disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
