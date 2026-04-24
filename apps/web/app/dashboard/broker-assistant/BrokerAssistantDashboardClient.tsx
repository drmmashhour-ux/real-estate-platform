"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BrokerAssistantComplianceLevel, BrokerAssistantOutput } from "@/modules/broker-assistant/broker-assistant.types";

export default function BrokerAssistantDashboardClient() {
  const searchParams = useSearchParams();
  const crmDealId = searchParams.get("crmDealId") ?? "";
  const intent = searchParams.get("intent") ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<BrokerAssistantOutput | null>(null);
  const [translation, setTranslation] = useState<{ professionalFr: string; notesFr: string } | null>(null);
  const [clausePreview, setClausePreview] = useState<BrokerAssistantOutput["suggestedClauses"] | null>(null);

  const runCheckDeal = useCallback(
    async (opts?: { complianceOnly?: boolean }) => {
      setLoading(true);
      setError(null);
      setTranslation(null);
      setClausePreview(null);
      try {
        const url = opts?.complianceOnly ? "/api/broker-assistant/check-compliance" : "/api/broker-assistant/check-deal";
        const body: Record<string, unknown> = crmDealId
          ? {
              crmDealId,
              documentType: "promise_to_purchase",
              languagePreference: "BILINGUAL",
            }
          : {
              documentType: "promise_to_purchase",
              transactionMode: "represented_purchase",
              offerStatus: "draft",
              languagePreference: "BILINGUAL",
              parties: [
                { role: "buyer", fullName: "" },
                { role: "seller", fullName: "Vendeur Exemple" },
              ],
              broker: { displayName: "Courtier Exemple", brokerDisclosureRecorded: false },
              listing: { addressLine: "100 rue Example", city: "Montréal", postalCode: "H2X 1Y1" },
              conditions: { financing: { present: true }, inspection: { present: false } },
              isPublicOrClientFacing: false,
            };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const j = (await res.json()) as { error?: string };
          throw new Error(j.error ?? res.statusText);
        }
        if (opts?.complianceOnly) {
          const d = (await res.json()) as {
            complianceLevel: BrokerAssistantComplianceLevel;
            complianceFlags: BrokerAssistantOutput["complianceFlags"];
            missingInformation: BrokerAssistantOutput["missingInformation"];
          };
          setOutput({
            status: "READY_FOR_REVIEW",
            complianceLevel: d.complianceLevel,
            summary: "Analyse de conformité assistive (couche seule).",
            summaryFr: "Analyse de conformité assistive (couche seule).",
            summaryEn: "Assistive compliance-only scan.",
            missingInformation: d.missingInformation,
            complianceFlags: d.complianceFlags,
            suggestedClauses: [],
            suggestedNextSteps: [],
            draftingSuggestions: [],
            confidenceScore: 0.5,
            disclaimersFr: [
              "Couche conformité seule — une analyse dossier complète peut être requise.",
              "Révision courtier obligatoire.",
            ],
            disclaimersEn: ["Compliance-only layer — full file review may still be required."],
          });
        } else {
          const data = (await res.json()) as { output?: BrokerAssistantOutput };
          if (data.output) setOutput(data.output);
          else setOutput(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    },
    [crmDealId],
  );

  const runTranslate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/broker-assistant/draft-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textEn: "Thank you for your offer. Please confirm the inspection deadline.",
          context: crmDealId ? { dealId: crmDealId, listing: { city: "Montréal" } } : { listing: { city: "Montréal" } },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "failed");
      const data = (await res.json()) as { translation: { professionalFr: string; notesFr: string } };
      setTranslation(data.translation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [crmDealId]);

  const runClauses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/broker-assistant/suggest-clauses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          crmDealId
            ? { crmDealId, documentType: "promise_to_purchase" }
            : {
                documentType: "promise_to_purchase",
                transactionMode: "represented_purchase",
                parties: [
                  { role: "buyer", fullName: "A" },
                  { role: "seller", fullName: "B" },
                ],
                listing: { addressLine: "1", city: "M", postalCode: "H1H1H1" },
              },
        ),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "failed");
      const data = (await res.json()) as { suggestedClauses: BrokerAssistantOutput["suggestedClauses"] };
      setClausePreview(data.suggestedClauses);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [crmDealId]);

  useEffect(() => {
    if (!intent) return;
    if (intent === "translate") void runTranslate();
    else if (intent === "clauses") void runClauses();
    else if (intent === "compliance") void runCheckDeal({ complianceOnly: true });
    else if (intent === "check" || intent === "ask") void runCheckDeal();
  }, [intent, runCheckDeal, runClauses, runTranslate]);

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">Québec résidentiel</p>
          <h1 className="text-2xl font-bold text-[#D4AF37]">AI Broker Assistant</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Assistance à la rédaction et à la conformité — sortie toujours{" "}
            <strong className="text-amber-200">READY_FOR_REVIEW</strong>. Aucun envoi automatique; le courtier demeure
            responsable.
          </p>
          {crmDealId ? (
            <p className="mt-2 text-xs text-amber-200/90">
              Dossier CRM lié : <span className="font-mono">{crmDealId}</span>
            </p>
          ) : null}
        </div>
        <Link href="/dashboard/broker/compliance" className="text-sm text-[#D4AF37] hover:underline">
          ← Compliance hub
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => void runCheckDeal()}
          className="rounded-lg border border-[#D4AF37]/40 bg-black px-4 py-2 text-sm text-[#D4AF37] disabled:opacity-50"
        >
          {crmDealId ? "Check file completeness (linked deal)" : "Check file completeness (demo payload)"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void runCheckDeal({ complianceOnly: true })}
          className="rounded-lg border border-white/20 bg-zinc-900 px-4 py-2 text-sm disabled:opacity-50"
        >
          Review compliance only
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void runTranslate()}
          className="rounded-lg border border-white/20 bg-zinc-900 px-4 py-2 text-sm disabled:opacity-50"
        >
          Draft message in French (EN sample)
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void runClauses()}
          className="rounded-lg border border-white/20 bg-zinc-900 px-4 py-2 text-sm disabled:opacity-50"
        >
          Suggest clause set
        </button>
      </div>

      {error ? <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-100">{error}</div> : null}

      {clausePreview && clausePreview.length > 0 ? (
        <Panel title="Suggested clauses (preview)">
          <ul className="space-y-2 text-sm text-gray-300">
            {clausePreview.map((c) => (
              <li key={c.categoryCode}>
                <strong>{c.titleFr}</strong> — {c.rationaleFr}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {output ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Statut">
            <p className="text-sm">
              <span className="text-gray-500">Compliance:</span>{" "}
              <span className="font-mono text-amber-200">{output.complianceLevel}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Confidence:</span>{" "}
              <span className="font-mono">{output.confidenceScore}</span>
            </p>
            <p className="mt-2 text-sm text-gray-300">{output.summary}</p>
          </Panel>
          <Panel title="Missing information">
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-300">
              {output.missingInformation.length === 0 ? (
                <li className="text-emerald-400">Aucun écart majeur détecté pour ce scénario.</li>
              ) : (
                output.missingInformation.map((m) => (
                  <li key={m.id}>
                    <span className="text-xs text-gray-500">{m.severity}</span> — {m.messageFr}
                  </li>
                ))
              )}
            </ul>
          </Panel>
          <Panel title="Compliance flags">
            <ul className="space-y-2 text-sm">
              {output.complianceFlags.map((f) => (
                <li key={f.id} className="border-l-2 border-amber-600/60 pl-2 text-gray-300">
                  <span className="text-xs uppercase text-gray-500">{f.level}</span> — {f.messageFr}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Suggested drafting (FR-first)">
            <ul className="space-y-3 text-sm text-gray-300">
              {output.draftingSuggestions.map((d) => (
                <li key={d.id}>
                  <p className="font-medium text-[#D4AF37]">{d.titleFr}</p>
                  <pre className="mt-1 whitespace-pre-wrap rounded bg-black/50 p-2 text-xs">{d.bodyFr}</pre>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Suggested clauses">
            <ul className="space-y-2 text-sm text-gray-300">
              {output.suggestedClauses.map((c) => (
                <li key={c.categoryCode}>
                  <strong>{c.titleFr}</strong> — {c.rationaleFr}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Next steps">
            <ul className="list-inside list-disc text-sm text-gray-300">
              {output.suggestedNextSteps.map((s) => (
                <li key={s.id}>{s.stepFr}</li>
              ))}
            </ul>
          </Panel>
          <Panel title="French translation preview">
            {translation ? (
              <>
                <pre className="whitespace-pre-wrap rounded bg-black/50 p-3 text-sm">{translation.professionalFr}</pre>
                <p className="mt-2 text-xs text-gray-500">{translation.notesFr}</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Utilisez « Draft message in French » ou le lien depuis le dossier.</p>
            )}
          </Panel>
          <Panel title="Ready for approval">
            <p className="text-sm text-amber-200">
              Statut moteur : {output.status}. Aucune action engageante côté serveur sans signature / approbation courtier.
            </p>
            <p className="mt-2 text-xs text-gray-500">{output.disclaimersFr.join(" ")}</p>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-4">
      <h2 className="mb-2 text-sm font-semibold text-[#D4AF37]">{title}</h2>
      {children}
    </div>
  );
}
