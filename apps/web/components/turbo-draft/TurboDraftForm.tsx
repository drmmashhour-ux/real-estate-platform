"use client";

import { useState, useEffect } from "react";
import { TurboFormTemplate, TurboField, TurboDraftInput, TurboDraftResult } from "@/modules/turbo-form-drafting/types";
import { FORM_TEMPLATES } from "@/modules/turbo-form-drafting/formRegistry";
import { TurboDraftRiskPanel } from "./TurboDraftRiskPanel";
import { TurboDraftNoticePanel } from "./TurboDraftNoticePanel";
import { TurboDraftPreview } from "./TurboDraftPreview";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";
import { Building2, ChevronRight, Check, X, Info, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";
import { ComplianceScoreResult, TrustBadge, SaferChoice, ProtectionModeStatus } from "@/modules/quebec-trust-hub/types";
import { ComplianceScoreCard } from "../trust-hub/ComplianceScoreCard";
import { TrustBadgeList } from "../trust-hub/TrustBadgeList";
import { SaferChoicePanel } from "../trust-hub/SaferChoicePanel";
import { ProtectionModeBanner } from "../trust-hub/ProtectionModeBanner";
import { BrokerAssistCard } from "../trust-hub/BrokerAssistCard";
import { ExplainClauseButton } from "../trust-hub/ExplainClauseButton";

interface Props {
  formKey: string;
  initialInput?: Partial<TurboDraftInput>;
  listingId?: string;
  listingKind?: "fsbo" | "crm" | "bnhub";
}

export function TurboDraftForm({ formKey, initialInput, listingId, listingKind }: Props) {
  const template = FORM_TEMPLATES[formKey];
  const { showToast } = useToast();
  const [answers, setAnswers] = useState<Record<string, any>>(initialInput?.answers || {});
  const [result, setResult] = useState<TurboDraftResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [canSign, setCanSign] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(!!listingId);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Trust Hub State
  const [complianceScore, setComplianceScore] = useState<ComplianceScoreResult | null>(null);
  const [trustBadges, setTrustBadges] = useState<TrustBadge[]>([]);
  const [saferChoices, setSaferChoices] = useState<SaferChoice[]>([]);
  const [protectionMode, setProtectionMode] = useState<ProtectionModeStatus | null>(null);

  useEffect(() => {
    if (listingId && listingKind) {
      void build();
    }
  }, [listingId, listingKind]);

  useEffect(() => {
    if (result?.draftId) {
      void refreshTrustHub(result.draftId);
    }
  }, [result?.draftId, answers]); // Refresh on answer changes

  if (!template) return <div>Template not found: {formKey}</div>;

  const currentStep = template.steps[currentStepIdx];
  const isLastStep = currentStepIdx === template.steps.length - 1;
  const progress = ((currentStepIdx + 1) / template.steps.length) * 100;

  async function build(autoSave = false) {
    if (!autoSave) setBusy(true);
    const input: any = {
      formKey,
      listingId,
      listingKind,
      role: initialInput?.role,
      transactionType: template.transactionType,
      propertyType: initialInput?.propertyType,
      representedStatus: initialInput?.representedStatus,
      parties: initialInput?.parties,
      property: initialInput?.property,
      answers,
      locale: initialInput?.locale || "fr",
      draftId: result?.draftId,
    };

    try {
      const res = await fetch("/api/turbo-draft/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      if (data.context?.answers) {
        setAnswers(data.context.answers);
      }
      if (!autoSave) {
        showToast(listingId ? "Listing data pre-filled" : "Draft synchronized", "success");
      }
      checkStatus(data.draftId);
    } catch (err) {
      if (!autoSave) {
        showToast("Draft synchronization failed", "error");
      }
    } finally {
      if (!autoSave) setBusy(false);
      setLoading(false);
    }
  }

  const handleNextStep = async () => {
    // 1. Validate current step
    const currentStepFields = template.fields.filter(f => currentStep.fieldKeys.includes(f.key));
    const missingFields = currentStepFields.filter(f => f.required && !answers[f.key]);
    
    if (missingFields.length > 0) {
      showToast(`Veuillez remplir les champs obligatoires: ${missingFields.map(f => f.label).join(", ")}`, "error");
      return;
    }

    // 2. Auto-save
    await build(true);
    // 3. Advance
    if (!isLastStep) {
      setCurrentStepIdx(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  async function checkStatus(draftId: string) {
    try {
      const res = await fetch("/api/turbo-draft/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId }),
      });
      const data = await res.json();
      setCanSign(data.canSign);
      setIsPaid(data.isPaid);
    } catch {}
  }

  async function handleExport() {
    if (!result?.draftId) return;
    try {
      const res = await fetch("/api/turbo-draft/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: result.draftId }),
      });
      const data = await res.json();
      if (res.status === 402) {
        // Payment required - start checkout
        const checkoutRes = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentType: "contract_generation",
            amountCents: 1500,
            currency: "cad",
            description: `Génération de contrat: ${template.title}`,
            successUrl: window.location.href + "&paid=true",
            cancelUrl: window.location.href,
            draftId: result.draftId,
          }),
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        }
        return;
      }
      if (data.pdfUrl) {
        window.open(data.pdfUrl, "_blank");
      }
    } catch {
      showToast("Export failed", "error");
    }
  }

  async function handleAcknowledge(noticeKey: string) {
    if (!result?.draftId) return;
    try {
      const res = await fetch("/api/turbo-draft/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: result.draftId, noticeKey }),
      });
      if (res.ok) {
        showToast("Notice acknowledged", "success");
        checkStatus(result.draftId);
      }
    } catch {}
  }

  const renderField = (field: TurboField) => {
    const val = answers[field.key];
    const setVal = (v: any) => setAnswers(prev => ({ ...prev, [field.key]: v }));

    switch (field.type) {
      case "money":
        return (
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{field.label}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-premium-gold">$</span>
              <input
                type="number"
                value={val ? val / 100 : ""}
                onChange={(e) => setVal(parseFloat(e.target.value) * 100)}
                placeholder="0.00"
                className="bnhub-input w-full pl-8 font-mono text-premium-gold"
              />
            </div>
          </div>
        );
      case "boolean":
        return (
          <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:border-premium-gold/20">
            <input
              type="checkbox"
              checked={!!val}
              onChange={(e) => setVal(e.target.checked)}
              className="h-5 w-5 rounded border-premium-gold/30 bg-black text-premium-gold focus:ring-premium-gold/40"
            />
            <label className="text-sm font-bold text-neutral-200">{field.label}</label>
          </div>
        );
      case "textarea":
        return (
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{field.label}</label>
            <textarea
              value={val || ""}
              onChange={(e) => setVal(e.target.value)}
              className="bnhub-input min-h-[100px] w-full text-sm"
              placeholder="..."
            />
          </div>
        );
      default:
        return (
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{field.label}</label>
            <input
              type="text"
              value={val || ""}
              onChange={(e) => setVal(e.target.value)}
              className="bnhub-input w-full"
              placeholder="..."
            />
          </div>
        );
    }
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[420px_1fr]">
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-premium-gold shadow-lg shadow-premium-gold/20">
              <Building2 className="h-6 w-6 text-black" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tighter text-white uppercase italic">{template.title}</h2>
              <TrustBadgeList badges={trustBadges} />
            </div>
          </div>
          
          <button 
            type="button"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-premium-gold/20 bg-premium-gold/5 text-premium-gold text-[10px] font-black uppercase tracking-widest hover:bg-premium-gold/10 transition-all"
            onClick={() => {
              const assistCard = document.getElementById('broker-assist-section');
              assistCard?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <HelpCircle className="h-3 w-3" />
            Get help from a broker
          </button>
        </div>

        {complianceScore && (
          <ComplianceScoreCard result={complianceScore} />
        )}

        <div className="bnhub-panel-muted space-y-6 p-8 relative overflow-hidden">
          {/* Progress Bar */}
          <div 
            className="absolute top-0 left-0 h-1 bg-premium-gold transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
          
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-premium-gold/60 italic">Étape {currentStepIdx + 1} sur {template.steps.length}</p>
            <h3 className="text-lg font-black text-white uppercase italic tracking-tight">{currentStep.title}</h3>
          </div>

          <div className="space-y-6">
            {currentStep.fieldKeys.map((key) => {
              const field = template.fields.find(f => f.key === key);
              if (!field) return null;
              return <div key={key}>{renderField(field)}</div>;
            })}
          </div>
          
          <div className="flex gap-4 pt-4 border-t border-white/5">
            {currentStepIdx > 0 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
              >
                Précédent
              </button>
            )}
            
            <button
              type="button"
              disabled={busy}
              onClick={handleNextStep}
              className="flex-[2] bnhub-touch-feedback rounded-xl bg-premium-gold py-4 text-[10px] font-black uppercase tracking-widest text-black shadow-xl shadow-premium-gold/20 disabled:opacity-50"
            >
              {busy ? "Enregistrement..." : isLastStep ? "Réviser le brouillon" : "Suivant"}
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-6">
            <SaferChoicePanel choices={saferChoices} />
            <TurboDraftRiskPanel risks={result.risks} />
            <TurboDraftNoticePanel 
              notices={result.notices} 
              draftId={result.draftId} 
              isRepresented={result.context?.representedStatus === "REPRESENTED"}
              onAcknowledge={handleAcknowledge} 
            />
          </div>
        )}
      </div>

      <div className="space-y-12">
        {protectionMode && <ProtectionModeBanner status={protectionMode} />}
        {result ? (
          <>
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 mb-8">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20">
                  <Check className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-tight italic text-emerald-500">Draft Summary Ready</h4>
                  <p className="text-xs text-neutral-400">Your draft has been updated and synchronized with the latest OACIQ-style logic.</p>
                </div>
              </div>
            </div>

            <TurboDraftPreview 
              sections={result.sections} 
              styleValidation={(result as any).styleValidation}
              draftId={result.draftId}
            />
            
            <div id="broker-assist-section" className="scroll-mt-8">
              <BrokerAssistCard draftId={result.draftId} />
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-black/80 to-neutral-900/80 p-12 text-center backdrop-blur-xl">
              <h3 className="text-2xl font-black tracking-tighter text-white uppercase italic mb-4">Signature Gateway</h3>
              <p className="text-sm text-neutral-500 max-w-md mx-auto mb-8">
                All critical notices must be acknowledged and blocking risks resolved before legal signing.
              </p>
              
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-neutral-500 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-neutral-500">
                      Ce document est une suggestion automatisée. Avant de signer, vous devez valider l&apos;exactitude des informations.
                      Pour toute question légale, consultez les guides de l&apos;OACIQ ci-dessous.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                  <Link 
                    href="https://www.oaciq.com/fr/vendre" 
                    target="_blank"
                    className="text-[10px] font-bold text-neutral-500 hover:text-premium-gold uppercase tracking-widest transition-colors"
                  >
                    Guide du Vendeur (OACIQ)
                  </Link>
                  <Link 
                    href="https://www.oaciq.com/fr/acheter" 
                    target="_blank"
                    className="text-[10px] font-bold text-neutral-500 hover:text-premium-gold uppercase tracking-widest transition-colors"
                  >
                    Guide de l&apos;Acheteur (OACIQ)
                  </Link>
                </div>

                <div className={cn(
                  "flex items-center gap-2 rounded-full px-6 py-2 text-xs font-black uppercase tracking-widest",
                  canSign ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-red-500/20 text-red-400 border border-red-500/50"
                )}>
                  {canSign ? (
                    <><Check className="h-3 w-3" /> Ready to Sign</>
                  ) : (
                    <><X className="h-3 w-3" /> Signature Blocked</>
                  )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="bnhub-touch-feedback rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-white/10"
                  >
                    Export PDF {!isPaid && "(15$)"}
                  </button>

                  <button
                    type="button"
                    disabled={!canSign}
                    className={cn(
                      "bnhub-touch-feedback rounded-2xl px-12 py-5 text-base font-black uppercase tracking-[0.3em] transition-all",
                      canSign 
                        ? "bg-premium-gold text-black shadow-2xl shadow-premium-gold/40 hover:scale-105 active:scale-95" 
                        : "bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50"
                    )}
                  >
                    Finalize & Sign
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-800 bg-neutral-900/20 text-center p-12">
            <div className="mb-6 rounded-full bg-neutral-900 p-6">
              <ChevronRight className="h-10 w-10 text-neutral-700" />
            </div>
            <h3 className="text-xl font-black tracking-tighter text-neutral-500 uppercase italic">Awaiting Input</h3>
            <p className="mt-2 text-sm text-neutral-600 max-w-xs">
              Complete the structured fields to generate a compliant draft preview.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
