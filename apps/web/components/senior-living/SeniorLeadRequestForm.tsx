"use client";

import { useState } from "react";

export function SeniorLeadRequestForm(props: { residenceId: string; matchScore?: number | null }) {
  const [requesterName, setRequesterName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg(null);
    try {
      const res = await fetch("/api/senior/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residenceId: props.residenceId,
          requesterName,
          email,
          phone: phone || undefined,
          ...(props.matchScore != null ? { matchScore: props.matchScore } : {}),
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setStatus("done");
      setMsg("Your request was sent. The residence will contact you.");
      setRequesterName("");
      setEmail("");
      setPhone("");
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <form className="sl-card space-y-6" onSubmit={submit} id="visit">
      <div>
        <h3 className="text-xl font-bold text-neutral-900">Request a visit</h3>
        <p className="mt-2 text-base sl-text-muted">
          Your details go to this residence only. This is not for emergencies — call emergency services if someone is
          unsafe.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <label className="flex flex-col gap-2 font-semibold text-neutral-900">
          Your name
          <input
            required
            autoComplete="name"
            className="sl-input font-normal"
            value={requesterName}
            onChange={(ev) => setRequesterName(ev.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 font-semibold text-neutral-900">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            className="sl-input font-normal"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 font-semibold text-neutral-900">
          Phone <span className="font-normal sl-text-muted">(optional)</span>
          <input
            type="tel"
            autoComplete="tel"
            className="sl-input font-normal"
            value={phone}
            onChange={(ev) => setPhone(ev.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="sl-btn-primary sl-btn-block-mobile min-h-[52px] w-full disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : "Send request"}
      </button>
      {msg ?
        <p className={`text-base font-semibold ${status === "error" ? "text-red-800" : "text-teal-900"}`} role="status">
          {msg}
        </p>
      : null}
    </form>
  );
}
