"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import {
  PARTNER_EMAIL_TEMPLATES,
  PARTNER_FOLLOW_UP_CHECKLIST,
  PARTNER_READINESS_CHECKLIST,
  PARTNER_RESOURCE_LINKS,
  buildContactLine,
  mergeTemplate,
  type EmailTemplateDef,
} from "@/lib/admin/partner-outreach";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function PartnerOutreachClient({ defaultPlatformUrl }: { defaultPlatformUrl: string }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [followChecked, setFollowChecked] = useState<Record<string, boolean>>({});

  const [templateId, setTemplateId] = useState<string>(PARTNER_EMAIL_TEMPLATES[0]!.id);
  const [contactName, setContactName] = useState("");
  const [yourName, setYourName] = useState("");
  const [yourTitle, setYourTitle] = useState("");
  const [yourEmail, setYourEmail] = useState("");
  const [platformUrl, setPlatformUrl] = useState(defaultPlatformUrl);
  const [geos, setGeos] = useState("Canada");
  const [trafficSummary, setTrafficSummary] = useState("To be shared under NDA — ask ops for current figures.");
  const [extraContext, setExtraContext] = useState("");
  const [polishAi, setPolishAi] = useState(true);

  const [previewSubject, setPreviewSubject] = useState("");
  const [previewBody, setPreviewBody] = useState("");
  const [previewSource, setPreviewSource] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => PARTNER_EMAIL_TEMPLATES.find((t) => t.id === templateId) ?? PARTNER_EMAIL_TEMPLATES[0]!,
    [templateId]
  );

  function buildVars() {
    return {
      PLATFORM_NAME,
      PLATFORM_URL: platformUrl.trim() || defaultPlatformUrl,
      YOUR_NAME: yourName.trim(),
      YOUR_TITLE: yourTitle.trim(),
      YOUR_EMAIL: yourEmail.trim(),
      COMPANY_NAME: "",
      CONTACT_LINE: buildContactLine(contactName),
      GEOS: geos.trim(),
      TRAFFIC_SUMMARY: trafficSummary.trim(),
    };
  }

  function localPreview(t: EmailTemplateDef) {
    const vars = buildVars();
    setPreviewSubject(mergeTemplate(t.subjectTemplate, vars));
    setPreviewBody(mergeTemplate(t.bodyTemplate, vars));
    setPreviewSource("local");
  }

  async function generateDraft() {
    setLoadingAi(true);
    setToast(null);
    try {
      const vars = {
        ...buildVars(),
        CONTACT_NAME: contactName.trim(),
      };
      const res = await fetch("/api/admin/partner-outreach/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          vars,
          polishWithAi: polishAi,
          extraContext: extraContext.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { subject?: string; body?: string; source?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setPreviewSubject(data.subject ?? "");
      setPreviewBody(data.body ?? "");
      setPreviewSource(data.source ?? "template");
      setToast(data.source === "openai" ? "Draft generated (AI-polished)." : "Draft merged from template.");
    } catch {
      setToast("Could not generate draft. Check you are signed in as admin.");
    } finally {
      setLoadingAi(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16 text-white">
      <div>
        <Link href="/admin/dashboard" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin control center
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Partner outreach (travel & OTAs)</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Internal checklist and email drafts for BD and affiliate conversations. AI only polishes text you already
          supply — it does not contact partners. Legal review before sending contracts.
        </p>
      </div>

      {toast ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {toast}
        </p>
      ) : null}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Readiness checklist</h2>
        <p className="mt-1 text-xs text-zinc-500">Tick items as your org completes them (browser session only).</p>
        <ul className="mt-4 space-y-3">
          {PARTNER_READINESS_CHECKLIST.map((item) => (
            <li key={item.id} className="flex gap-3">
              <input
                type="checkbox"
                checked={Boolean(checked[item.id])}
                onChange={(e) => setChecked((c) => ({ ...c, [item.id]: e.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-amber-500"
              />
              <div>
                <span className="text-sm font-medium text-zinc-200">{item.label}</span>
                {item.hint ? <p className="text-xs text-zinc-500">{item.hint}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">After you send</h2>
        <ul className="mt-4 space-y-2">
          {PARTNER_FOLLOW_UP_CHECKLIST.map((item) => (
            <li key={item.id} className="flex gap-3">
              <input
                type="checkbox"
                checked={Boolean(followChecked[item.id])}
                onChange={(e) => setFollowChecked((c) => ({ ...c, [item.id]: e.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-amber-500"
              />
              <span className="text-sm text-zinc-300">{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Resources</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {PARTNER_RESOURCE_LINKS.map((r) => (
            <li key={r.href + r.label}>
              <a
                href={r.href.startsWith("http") ? r.href : `${defaultPlatformUrl.replace(/\/$/, "")}${r.href}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-amber-400 hover:text-amber-300"
              >
                {r.label}
              </a>
              <span className="text-zinc-500"> — {r.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-500/25 bg-amber-950/10 p-5">
        <h2 className="text-lg font-semibold text-amber-100">Email builder</h2>
        <p className="mt-1 text-xs text-amber-200/70">
          Fill fields → Generate draft. Copy/paste into your mail client from your company address.
        </p>

        <label className="mt-4 block text-xs font-medium text-zinc-500">
          Template
          <select
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              const t = PARTNER_EMAIL_TEMPLATES.find((x) => x.id === e.target.value);
              if (t) localPreview(t);
            }}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            {PARTNER_EMAIL_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-zinc-500">{selectedTemplate.description}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-zinc-500">
            Recipient first name (optional)
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Jordan"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-500">
            Your name
            <input
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-500">
            Title
            <input
              value={yourTitle}
              onChange={(e) => setYourTitle(e.target.value)}
              placeholder="Partnerships"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-500">
            Your email
            <input
              value={yourEmail}
              onChange={(e) => setYourEmail(e.target.value)}
              type="email"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-500 sm:col-span-2">
            Public site URL
            <input
              value={platformUrl}
              onChange={(e) => setPlatformUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-500">
            Primary geos
            <input
              value={geos}
              onChange={(e) => setGeos(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-500">
            Traffic / scale (honest)
            <input
              value={trafficSummary}
              onChange={(e) => setTrafficSummary(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
        </div>

        <label className="mt-4 block text-xs font-medium text-zinc-500">
          Extra notes for AI polish only (optional)
          <textarea
            value={extraContext}
            onChange={(e) => setExtraContext(e.target.value)}
            rows={2}
            placeholder="e.g. We already run BNHUB Travel AI at /bnhub/travel/compare"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
        </label>

        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={polishAi}
            onChange={(e) => setPolishAi(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-amber-500"
          />
          Polish with OpenAI (requires OPENAI_API_KEY; otherwise template-only)
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => localPreview(selectedTemplate)}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700"
          >
            Preview (template only)
          </button>
          <button
            type="button"
            disabled={loadingAi}
            onClick={() => void generateDraft()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {loadingAi ? "Generating…" : "Generate draft"}
          </button>
        </div>

        {previewSubject || previewBody ? (
          <div className="mt-6 space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Preview {previewSource ? `(${previewSource})` : ""}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void copyText(previewSubject).then((ok) => setToast(ok ? "Subject copied." : "Copy failed."))
                  }
                  className="text-xs text-amber-400 hover:underline"
                >
                  Copy subject
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(previewBody).then((ok) => setToast(ok ? "Body copied." : "Copy failed."))
                  }
                  className="text-xs text-amber-400 hover:underline"
                >
                  Copy body
                </button>
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-200">Subject: {previewSubject}</p>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 text-xs text-zinc-300">
              {previewBody}
            </pre>
          </div>
        ) : null}
      </section>
    </div>
  );
}
