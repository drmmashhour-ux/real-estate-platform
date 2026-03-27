"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Scale, Shield, Sparkles, Users } from "lucide-react";
import { LegalAiDisclaimer } from "@/components/legal/LegalAiDisclaimer";
import {
  contentLicenseSummary,
  getContentLicenseSections,
  type ContentLicenseLocale,
} from "@/modules/legal/content-license";

const ICONS = {
  doc: FileText,
  shield: Shield,
  scale: Scale,
  users: Users,
} as const;

export type ContentLicenseModalProps = {
  open: boolean;
  requiredVersion: string;
  locale?: ContentLicenseLocale;
  onClose: () => void;
  onAccepted: () => void;
};

export function ContentLicenseModal({
  open,
  requiredVersion,
  locale = "en",
  onClose,
  onAccepted,
}: ContentLicenseModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [explainLoadingKey, setExplainLoadingKey] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainBySection, setExplainBySection] = useState<Record<string, string>>({});

  const sections = getContentLicenseSections(locale);

  useEffect(() => {
    if (!open) {
      setScrolledToEnd(false);
      setChecked(false);
      setErr(null);
      setExplainLoadingKey(null);
      setExplainBySection({});
    }
  }, [open]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop - clientHeight < 48) {
      setScrolledToEnd(true);
    }
  }, []);

  async function explainSection(sectionTitle: string, sectionBody: string) {
    setExplainLoadingKey(sectionTitle);
    setExplainLoading(true);
    try {
      const res = await fetch("/api/legal/ai/explain-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ sectionTitle, sectionBody, locale }),
      });
      const j = (await res.json()) as { plainSummary?: string; text?: string; error?: string };
      if (!res.ok) {
        setExplainBySection((prev) => ({
          ...prev,
          [sectionTitle]: typeof j.error === "string" ? j.error : "Could not load explanation.",
        }));
        return;
      }
      const text = j.plainSummary ?? j.text ?? "";
      setExplainBySection((prev) => ({ ...prev, [sectionTitle]: text }));
    } finally {
      setExplainLoading(false);
      setExplainLoadingKey(null);
    }
  }

  async function accept() {
    if (!scrolledToEnd || !checked) return;
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/legal/content-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ version: requiredVersion }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : "Could not save acceptance");
        return;
      }
      onAccepted();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-license-title"
    >
      <div className="flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0f0f0f] shadow-2xl">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 id="content-license-title" className="text-lg font-semibold text-white">
            Content &amp; Usage License
          </h2>
          <p className="mt-1 text-xs text-amber-200/90">Version {requiredVersion}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{contentLicenseSummary[locale]}</p>
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-3"
        >
          <ul className="space-y-4">
            {sections.map((s) => {
              const Icon = ICONS[s.icon] ?? FileText;
              return (
                <li key={s.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex gap-2">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-400/90" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-100">{s.title}</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">{s.body}</p>
                      <button
                        type="button"
                        disabled={explainLoading && explainLoadingKey === s.title}
                        onClick={() => void explainSection(s.title, s.body)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200/95 hover:bg-amber-500/20 disabled:opacity-50"
                      >
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        Explain this in simple terms
                      </button>
                      {explainBySection[s.title] ? (
                        <div className="mt-2 rounded-lg border border-white/10 bg-black/40 p-2.5">
                          <p className="text-[11px] font-medium text-slate-200">Plain language</p>
                          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
                            {explainBySection[s.title]}
                          </p>
                          <div className="mt-2">
                            <LegalAiDisclaimer />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-3 border-t border-white/10 px-5 py-4">
          {!scrolledToEnd ? (
            <p className="text-center text-xs text-slate-500">Scroll to the end to enable acceptance.</p>
          ) : null}
          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-200">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500"
              checked={checked}
              disabled={!scrolledToEnd}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>I understand and agree to the Content &amp; Usage License for this platform version.</span>
          </label>
          {err ? <p className="text-sm text-red-400">{err}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!scrolledToEnd || !checked || submitting}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40"
              onClick={() => void accept()}
            >
              {submitting ? "Saving…" : "Accept & continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
