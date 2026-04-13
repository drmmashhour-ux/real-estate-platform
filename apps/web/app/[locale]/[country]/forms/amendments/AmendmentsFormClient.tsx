"use client";

import Link from "next/link";
import { useState } from "react";
import type { AmendmentsPayload } from "@/lib/forms/templates/amendments";

type Props = { initialPayload: AmendmentsPayload };

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
  type?: "text" | "textarea" | "checkbox" | "date" | "time";
  placeholder?: string;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  if (type === "checkbox") {
    return (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-slate-600 bg-slate-900 text-emerald-500"
        />
        <span className="text-sm text-slate-300">{label}</span>
      </label>
    );
  }
  if (type === "textarea") {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-400">
          {label}
        </label>
        <textarea
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
        />
      </div>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-400">
        {label}
      </label>
      <input
        id={id}
        type={type === "date" || type === "time" ? type : "text"}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-200">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function AmendmentsFormClient({ initialPayload }: Props) {
  const [payload, setPayload] = useState<AmendmentsPayload>(initialPayload);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof AmendmentsPayload>(key: K, value: AmendmentsPayload[K]) => {
    setPayload((p) => ({ ...p, [key]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "amendments",
          status: "submitted",
          clientName: clientName.trim() || undefined,
          clientEmail: clientEmail.trim() || undefined,
          payload: payload,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Submission failed");
        return;
      }
      setDone(data.id ?? "Submitted successfully.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
        <p className="font-medium text-emerald-200">Form submitted successfully.</p>
        <p className="mt-2 text-sm text-slate-400">
          Your submission has been sent to the administrator for review. Reference: {done}
        </p>
        <Link href="/forms" className="mt-4 inline-block text-sm text-emerald-400 hover:underline">
          ← Back to forms
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="mt-8 space-y-8"
    >
      <Section title="Your contact (for this submission)">
        <Field label="Your name" value={clientName} onChange={(v) => setClientName(String(v))} placeholder="Full name" />
        <Field label="Email" value={clientEmail} onChange={(v) => setClientEmail(String(v))} type="text" placeholder="email@example.com" />
      </Section>

      <Section title="M1 Reference">
        <Field
          label="Principal form type"
          value={payload.principalFormType ?? ""}
          onChange={(v) => update("principalFormType", v as string)}
          placeholder="e.g. Brokerage contract to purchase"
        />
        <Field
          label="Other (if applicable)"
          value={payload.principalFormOther ?? ""}
          onChange={(v) => update("principalFormOther", v as string)}
        />
        <Field
          label="Address of immovable"
          value={payload.immovableAddress ?? ""}
          onChange={(v) => update("immovableAddress", v as string)}
          placeholder="Full address"
        />
      </Section>

      <Section title="M2 Brokerage contract amendments">
        <Field
          label="Brokerage expiry clause"
          value={payload.brokerageExpiryClause ?? ""}
          onChange={(v) => update("brokerageExpiryClause", v as string)}
        />
        <Field
          label="Brokerage expiry date"
          value={payload.brokerageExpiryDate ?? ""}
          onChange={(v) => update("brokerageExpiryDate", v as string)}
          type="date"
        />
        <Field
          label="Brokerage sale price clause"
          value={payload.brokerageSalePriceClause ?? ""}
          onChange={(v) => update("brokerageSalePriceClause", v as string)}
        />
        <Field
          label="Brokerage sale price"
          value={payload.brokerageSalePrice ?? ""}
          onChange={(v) => update("brokerageSalePrice", v as string)}
        />
      </Section>

      <Section title="M3 Extension of acceptance period">
        <Field
          label="Acceptance clause"
          value={payload.acceptanceClause ?? ""}
          onChange={(v) => update("acceptanceClause", v as string)}
        />
        <Field
          label="Acceptance time"
          value={payload.acceptanceTime ?? ""}
          onChange={(v) => update("acceptanceTime", v as string)}
          type="time"
        />
        <Field
          label="Acceptance date"
          value={payload.acceptanceDate ?? ""}
          onChange={(v) => update("acceptanceDate", v as string)}
          type="date"
        />
      </Section>

      <Section title="M4 Extension of time period">
        <Field
          label="Time period clause"
          value={payload.timePeriodClause ?? ""}
          onChange={(v) => update("timePeriodClause", v as string)}
        />
        <Field
          label="Extended date"
          value={payload.extendedDate ?? ""}
          onChange={(v) => update("extendedDate", v as string)}
          type="date"
        />
      </Section>

      <Section title="M5 Other amendments">
        <Field
          label="Other amendments"
          value={payload.otherAmendments ?? ""}
          onChange={(v) => update("otherAmendments", v as string)}
          type="textarea"
        />
      </Section>

      <Section title="M6 Other conditions">
        <Field
          label="Other conditions confirmed"
          value={payload.otherConditionsConfirmed ?? false}
          onChange={(v) => update("otherConditionsConfirmed", v as boolean)}
          type="checkbox"
        />
      </Section>

      <Section title="M7 Signatures – Buyer">
        <Field label="Buyer agency role" value={payload.buyerAgencyRole ?? ""} onChange={(v) => update("buyerAgencyRole", v as string)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Signed city 1" value={payload.buyerSignedCity1 ?? ""} onChange={(v) => update("buyerSignedCity1", v as string)} />
          <Field label="Signed date 1" value={payload.buyerSignedDate1 ?? ""} onChange={(v) => update("buyerSignedDate1", v as string)} type="date" />
          <Field label="Signed time 1" value={payload.buyerSignedTime1 ?? ""} onChange={(v) => update("buyerSignedTime1", v as string)} type="time" />
          <Field label="Signature 1" value={payload.buyerSignature1 ?? ""} onChange={(v) => update("buyerSignature1", v as string)} />
          <Field label="Witness 1" value={payload.buyerWitness1 ?? ""} onChange={(v) => update("buyerWitness1", v as string)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Signed city 2" value={payload.buyerSignedCity2 ?? ""} onChange={(v) => update("buyerSignedCity2", v as string)} />
          <Field label="Signed date 2" value={payload.buyerSignedDate2 ?? ""} onChange={(v) => update("buyerSignedDate2", v as string)} type="date" />
          <Field label="Signed time 2" value={payload.buyerSignedTime2 ?? ""} onChange={(v) => update("buyerSignedTime2", v as string)} type="time" />
          <Field label="Signature 2" value={payload.buyerSignature2 ?? ""} onChange={(v) => update("buyerSignature2", v as string)} />
          <Field label="Witness 2" value={payload.buyerWitness2 ?? ""} onChange={(v) => update("buyerWitness2", v as string)} />
        </div>
      </Section>

      <Section title="M7 Signatures – Seller">
        <Field label="Seller agency role" value={payload.sellerAgencyRole ?? ""} onChange={(v) => update("sellerAgencyRole", v as string)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Signed city 1" value={payload.sellerSignedCity1 ?? ""} onChange={(v) => update("sellerSignedCity1", v as string)} />
          <Field label="Signed date 1" value={payload.sellerSignedDate1 ?? ""} onChange={(v) => update("sellerSignedDate1", v as string)} type="date" />
          <Field label="Signed time 1" value={payload.sellerSignedTime1 ?? ""} onChange={(v) => update("sellerSignedTime1", v as string)} type="time" />
          <Field label="Signature 1" value={payload.sellerSignature1 ?? ""} onChange={(v) => update("sellerSignature1", v as string)} />
          <Field label="Witness 1" value={payload.sellerWitness1 ?? ""} onChange={(v) => update("sellerWitness1", v as string)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Signed city 2" value={payload.sellerSignedCity2 ?? ""} onChange={(v) => update("sellerSignedCity2", v as string)} />
          <Field label="Signed date 2" value={payload.sellerSignedDate2 ?? ""} onChange={(v) => update("sellerSignedDate2", v as string)} type="date" />
          <Field label="Signed time 2" value={payload.sellerSignedTime2 ?? ""} onChange={(v) => update("sellerSignedTime2", v as string)} type="time" />
          <Field label="Signature 2" value={payload.sellerSignature2 ?? ""} onChange={(v) => update("sellerSignature2", v as string)} />
          <Field label="Witness 2" value={payload.sellerWitness2 ?? ""} onChange={(v) => update("sellerWitness2", v as string)} />
        </div>
      </Section>

      <Section title="M7 Signatures – Spouse intervention">
        <Field label="Spouse intervention" value={payload.spouseIntervention ?? ""} onChange={(v) => update("spouseIntervention", v as string)} type="textarea" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Signed city" value={payload.spouseSignedCity ?? ""} onChange={(v) => update("spouseSignedCity", v as string)} />
          <Field label="Signed date" value={payload.spouseSignedDate ?? ""} onChange={(v) => update("spouseSignedDate", v as string)} type="date" />
          <Field label="Signed time" value={payload.spouseSignedTime ?? ""} onChange={(v) => update("spouseSignedTime", v as string)} type="time" />
          <Field label="Signature" value={payload.spouseSignature ?? ""} onChange={(v) => update("spouseSignature", v as string)} />
          <Field label="Witness" value={payload.spouseWitness ?? ""} onChange={(v) => update("spouseWitness", v as string)} />
        </div>
      </Section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit form"}
        </button>
      </div>
    </form>
  );
}
