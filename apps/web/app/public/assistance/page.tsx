"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { classifyAssistance, suggestAssistancePath } from "@/lib/compliance/assistance";

export default function AssistanceCenterPage() {
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("general");
  const [language, setLanguage] = useState("en");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mentionsDeposit, setMentionsDeposit] = useState(false);
  const [mentionsFraud, setMentionsFraud] = useState(false);
  const [userConfirmedEscalation, setUserConfirmedEscalation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const previewType = useMemo(
    () =>
      classifyAssistance({
        message,
        mentionsDeposit,
        mentionsFraud,
      }),
    [message, mentionsDeposit, mentionsFraud]
  );

  const previewPath = useMemo(() => suggestAssistancePath({ requestType: previewType }), [previewType]);

  const needsEscalationConfirm = previewPath === "file_complaint";

  async function submit() {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/assistance/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          topic,
          language,
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          mentionsDeposit,
          mentionsFraud,
          userConfirmedEscalation: needsEscalationConfirm ? userConfirmedEscalation : true,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        request?: { requestNumber: string; aiSuggestedPath?: string | null };
      };
      if (!res.ok || !data.success) {
        setFeedback(data.error ?? "Request failed");
        return;
      }
      setFeedback(`Submitted — reference ${data.request?.requestNumber ?? ""}. Suggested path: ${data.request?.aiSuggestedPath ?? "—"}.`);
      setMessage("");
      setUserConfirmedEscalation(false);
    } catch {
      setFeedback("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 text-white">
      <div className="space-y-2">
        <h1 className="text-2xl text-[#D4AF37] font-bold">Public Assistance Center</h1>
        <p className="text-sm text-gray-400">
          Get information and guidance before filing a formal complaint. Nothing here is legal advice. Serious concerns may
          be directed toward the complaints process after you confirm escalation.
        </p>
        <p className="text-xs text-gray-500">
          <Link href="/dashboard/broker/complaints" className="text-[#D4AF37] underline">
            Broker complaints desk
          </Link>{" "}
          (signed-in brokers)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-gray-500 grid gap-1">
          Topic
          <select
            className="bg-black text-white border border-gray-700 p-2"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="general">General</option>
            <option value="listing">Listing</option>
            <option value="offer">Offer</option>
            <option value="deposit">Deposit / trust</option>
            <option value="contract">Contract</option>
            <option value="commission">Commission</option>
          </select>
        </label>
        <label className="text-xs text-gray-500 grid gap-1">
          Language
          <select
            className="bg-black text-white border border-gray-700 p-2"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
        </label>
      </div>

      <input
        className="w-full bg-black text-white border border-gray-700 p-3"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full bg-black text-white border border-gray-700 p-3"
        placeholder="Email (recommended)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />

      <textarea
        className="w-full bg-black text-white border border-gray-700 p-3 min-h-[140px]"
        placeholder="Describe your question or situation..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input type="checkbox" checked={mentionsDeposit} onChange={(e) => setMentionsDeposit(e.target.checked)} />
        Relates to deposit / trust funds
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input type="checkbox" checked={mentionsFraud} onChange={(e) => setMentionsFraud(e.target.checked)} />
        Possible fraud or serious misrepresentation
      </label>

      <p className="text-xs text-gray-500">
        Preview (non-binding): type <span className="text-gray-300">{previewType}</span> · suggested path{" "}
        <span className="text-gray-300">{previewPath}</span>
      </p>

      {needsEscalationConfirm ? (
        <label className="flex items-start gap-2 text-sm text-amber-200/90 border border-amber-900/40 rounded-lg p-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={userConfirmedEscalation}
            onChange={(e) => setUserConfirmedEscalation(e.target.checked)}
          />
          <span>
            I understand this may be treated as a pre-complaint and that staff may suggest filing a formal complaint for
            accountable review.
          </span>
        </label>
      ) : null}

      <button
        type="button"
        disabled={busy || !message.trim()}
        onClick={() => void submit()}
        className="bg-[#D4AF37] text-black px-4 py-2 font-semibold rounded disabled:opacity-50"
      >
        {busy ? "Sending…" : "Get help"}
      </button>

      {feedback ? <p className="text-sm text-gray-300">{feedback}</p> : null}
    </div>
  );
}
