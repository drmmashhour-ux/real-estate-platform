"use client";

import { useState } from "react";
import { AiWriterToolbar } from "@/components/ai/AiWriterToolbar";
import { DictationCorrectionButton } from "@/components/dictation/DictationCorrectionButton";

export function ContactFormClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("Buying a home");
  const [locationPreference, setLocationPreference] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [consentSmsWhatsapp, setConsentSmsWhatsapp] = useState(false);
  const [consentVoice, setConsentVoice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          interest,
          locationPreference: locationPreference || undefined,
          budget: budget || undefined,
          message: message.trim() || undefined,
          consentSmsWhatsapp,
          consentVoice,
          locale: typeof navigator !== "undefined" ? navigator.language : "en",
        }),
      });
      const raw = await res.text();
      let data: { error?: string; ok?: boolean } = {};
      try {
        data = raw ? (JSON.parse(raw) as { error?: string; ok?: boolean }) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        throw new Error(data.error ?? `Could not send inquiry (${res.status}). Try again or email us.`);
      }
      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setLocationPreference("");
      setBudget("");
      setMessage("");
      setConsentSmsWhatsapp(false);
      setConsentVoice(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-premium-gold/35 bg-premium-gold/10 p-8 text-center">
        <p className="text-lg font-medium text-premium-gold">Thank you</p>
        <p className="mt-2 text-sm text-[#B3B3B3]">
          We&apos;ll respond within one business day. No spam, ever.
        </p>
      </div>
    );
  }

  const input =
    "w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2.5 text-sm text-white placeholder:text-[#B3B3B3]/55 focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/25";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-premium-gold/25 bg-[#121212] p-5 shadow-xl shadow-black/40 sm:p-6 lg:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#B3B3B3]">
            Full name
          </label>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={input}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#B3B3B3]">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={input}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#B3B3B3]">
            Phone (optional)
          </label>
          <input
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#B3B3B3]">
            Interest
          </label>
          <select
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className={input}
          >
            <option>Buying a home</option>
            <option>Investment properties</option>
            <option>Rentals</option>
            <option>Portfolio review</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#B3B3B3]">
          Location preference
        </label>
        <input
          type="text"
          placeholder="City, neighborhood, or region"
          value={locationPreference}
          onChange={(e) => setLocationPreference(e.target.value)}
          className={input}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#B3B3B3]">
          Approximate budget (USD)
        </label>
        <input
          type="text"
          placeholder="$500k – $1.2M"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className={input}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-[#0B0B0B] p-4">
        <p className="text-xs font-medium text-white">Follow-up consent (optional)</p>
        <p className="text-[11px] text-[#B3B3B3]">
          Automated assistant messages only — not a licensed broker. You can opt out anytime (e.g. reply STOP to SMS).
        </p>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-[#B3B3B3]">
          <input
            type="checkbox"
            checked={consentSmsWhatsapp}
            onChange={(e) => setConsentSmsWhatsapp(e.target.checked)}
            className="mt-1 rounded border-white/20 bg-[#121212] text-premium-gold focus:ring-premium-gold"
          />
          <span>
            SMS / WhatsApp follow-up for this inquiry{" "}
            <span className="text-[#B3B3B3]/70">(phone required)</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-[#B3B3B3]">
          <input
            type="checkbox"
            checked={consentVoice}
            onChange={(e) => setConsentVoice(e.target.checked)}
            className="mt-1 rounded border-white/20 bg-[#121212] text-premium-gold focus:ring-premium-gold"
          />
          <span>
            Automated voice call for hot leads only{" "}
            <span className="text-[#B3B3B3]/70">(phone required; platform may disable)</span>
          </span>
        </label>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label className="block text-xs font-medium text-[#B3B3B3]">
            How can we help?
          </label>
          <DictationCorrectionButton
            value={message}
            onCorrected={setMessage}
            label="Correct dictation"
          />
        </div>
        <AiWriterToolbar
          className="mb-2"
          type="message"
          value={message}
          onChange={setMessage}
          showDescriptionGenerator={false}
        />
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          placeholder="Share a bit about your goals, timing, and what matters most to you. You can dictate and then use “Correct dictation” to fix speech-to-text errors."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${input} min-h-[120px] resize-y`}
          autoComplete="off"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full bg-premium-gold px-6 py-2.5 text-sm font-bold text-black shadow-lg shadow-premium-gold/30 transition hover:bg-premium-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit inquiry"}
        </button>
        <p className="text-[11px] text-[#B3B3B3]">
          We&apos;ll respond within one business day. No spam, ever.
        </p>
      </div>
    </form>
  );
}
