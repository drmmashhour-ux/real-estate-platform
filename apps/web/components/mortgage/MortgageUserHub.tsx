"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MortgageAiInsightCard } from "@/components/mortgage/MortgageAiInsightCard";
import { PreApprovalEstimateCard, type PreApprovalSnapshot } from "@/components/mortgage/PreApprovalEstimateCard";
import { buildRuleBasedMortgageInsight } from "@/lib/ai/mortgage-insight-narrative";
import { useToast } from "@/components/ui/ToastProvider";
import { formatCurrencyCAD } from "@/lib/investment/format";
import { formatBrokerResponseTimeLabel } from "@/modules/mortgage/services/broker-public-display";

type ContactBroker = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  rating: number;
  totalReviews: number;
  responseTimeAvg: number | null;
  totalLeadsHandled: number;
  isTopBroker: boolean;
};

type ContactPayload = {
  broker: ContactBroker | null;
  pendingBrokerReview?: boolean;
  request: {
    id: string;
    status: string;
    propertyPrice: number;
    intentLevel?: string;
    timeline?: string;
    preApproved?: boolean;
    createdAt: string;
    estimatedApprovalAmount?: number | null;
    estimatedMonthlyPayment?: number | null;
    approvalConfidence?: string | null;
    downPayment?: number;
    income?: number;
  } | null;
};

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "approved") return "border-emerald-500/50 bg-emerald-950/50 text-emerald-200";
  if (s === "contacted") return "border-sky-500/50 bg-sky-950/45 text-sky-200";
  return "border-amber-500/45 bg-amber-950/35 text-amber-100";
}

export function MortgageFinancingBanner() {
  return (
    <div
      id="financing-banner"
      className="rounded-2xl border border-premium-gold/35 bg-gradient-to-br from-[#14110a] to-[#0B0B0B] px-4 py-4 sm:px-5"
    >
      <p className="text-sm font-semibold text-premium-gold">Need financing?</p>
      <p className="mt-1 text-sm text-slate-300">
        Connect with a mortgage expert to review your numbers and explore pre-approval options.
      </p>
      <p className="mt-3">
        <a
          href="/mortgage#request-contact"
          className="text-sm font-semibold text-premium-gold underline hover:text-premium-gold"
        >
          Request a real approval estimate →
        </a>
      </p>
    </div>
  );
}

export function MortgageUserHub({
  isLoggedIn,
  variant,
  prefillPropertyPrice = "",
}: {
  isLoggedIn: boolean;
  variant: "analyze" | "dashboard";
  /** From analyzer — pre-fills property price on the mortgage form */
  prefillPropertyPrice?: string;
}) {
  const { showToast } = useToast();
  const [data, setData] = useState<ContactPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [propertyPrice, setPropertyPrice] = useState(prefillPropertyPrice);
  const [downPayment, setDownPayment] = useState("");
  const [income, setIncome] = useState("");
  const [timeline, setTimeline] = useState<string>("1-3 months");
  const [preApproved, setPreApproved] = useState<string>("no");
  const [submitSuccess, setSubmitSuccess] = useState<{ main: string; hint?: string } | null>(null);
  const [freshPreApproval, setFreshPreApproval] = useState<PreApprovalSnapshot | null>(null);
  const [mortgageInsight, setMortgageInsight] = useState<string | null>(null);
  const [mortgageInsightSource, setMortgageInsightSource] = useState<"openai" | "rules" | null>(null);
  const [mortgageInsightLoading, setMortgageInsightLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const estimateFromRequest = useMemo((): PreApprovalSnapshot | null => {
    const r = data?.request;
    if (
      r &&
      typeof r.estimatedApprovalAmount === "number" &&
      Number.isFinite(r.estimatedApprovalAmount) &&
      typeof r.estimatedMonthlyPayment === "number" &&
      Number.isFinite(r.estimatedMonthlyPayment) &&
      typeof r.approvalConfidence === "string" &&
      r.approvalConfidence
    ) {
      return {
        estimatedApprovalAmount: r.estimatedApprovalAmount,
        estimatedMonthlyPayment: r.estimatedMonthlyPayment,
        approvalConfidence: r.approvalConfidence,
      };
    }
    return null;
  }, [data]);

  const displayedPreApproval = freshPreApproval ?? estimateFromRequest;

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/mortgage/contact", { credentials: "include" });
      const json = (await res.json()) as ContactPayload;
      setData({
        ...json,
        pendingBrokerReview: json.pendingBrokerReview === true,
      });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (prefillPropertyPrice) setPropertyPrice(prefillPropertyPrice);
  }, [prefillPropertyPrice]);

  useEffect(() => {
    if (!displayedPreApproval || !isLoggedIn) {
      setMortgageInsight(null);
      setMortgageInsightSource(null);
      setMortgageInsightLoading(false);
      return;
    }

    const pp = Number(propertyPrice);
    const dp = Number(downPayment);
    const inc = Number(income);
    const req = data?.request;
    const price = Number.isFinite(pp) && pp > 0 ? pp : req?.propertyPrice ?? 0;
    const downPay = Number.isFinite(dp) && dp >= 0 ? dp : req?.downPayment ?? 0;
    const annual = Number.isFinite(inc) && inc > 0 ? inc : req?.income ?? 0;

    if (!(price > 0) || !(annual > 0)) {
      setMortgageInsight(null);
      setMortgageInsightSource(null);
      setMortgageInsightLoading(false);
      return;
    }

    let cancelled = false;
    setMortgageInsightLoading(true);

    const body = {
      propertyPrice: price,
      downPayment: downPay,
      annualIncome: annual,
      estimatedApprovalAmount: displayedPreApproval.estimatedApprovalAmount,
      approvalConfidence: displayedPreApproval.approvalConfidence,
    };

    void fetch("/api/ai/mortgage-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          text?: string;
          source?: "openai" | "rules";
        };
        if (cancelled) return;
        if (json.ok && typeof json.text === "string") {
          setMortgageInsight(json.text);
          setMortgageInsightSource(json.source === "openai" ? "openai" : "rules");
        } else {
          setMortgageInsight(buildRuleBasedMortgageInsight(body));
          setMortgageInsightSource("rules");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setMortgageInsight(buildRuleBasedMortgageInsight(body));
        setMortgageInsightSource("rules");
      })
      .finally(() => {
        if (!cancelled) setMortgageInsightLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [displayedPreApproval, isLoggedIn, propertyPrice, downPayment, income, data?.request]);

  const submitBrokerReview = async () => {
    if (!data?.request?.id) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch("/api/mortgage/broker-review", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mortgageRequestId: data.request.id,
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showToast(typeof json.error === "string" ? json.error : "Could not submit review", "info");
        return;
      }
      showToast("Thanks for your feedback.", "success");
      setReviewComment("");
      await load();
    } finally {
      setReviewSubmitting(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/mortgage/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyPrice: Number(propertyPrice),
          downPayment: Number(downPayment),
          income: Number(income),
          timeline,
          preApproved: preApproved === "yes",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof json.error === "string" ? json.error : "Could not submit request", "info");
        return;
      }
      const main =
        typeof json.clientMessage === "string"
          ? json.clientMessage
          : "Your request has been sent to a mortgage expert. You will be contacted shortly.";
      const hint = typeof json.qualificationHint === "string" ? json.qualificationHint : undefined;
      setSubmitSuccess({ main, hint });
      if (
        typeof json.estimatedApprovalAmount === "number" &&
        typeof json.estimatedMonthlyPayment === "number" &&
        typeof json.approvalConfidence === "string"
      ) {
        setFreshPreApproval({
          estimatedApprovalAmount: json.estimatedApprovalAmount,
          estimatedMonthlyPayment: json.estimatedMonthlyPayment,
          approvalConfidence: json.approvalConfidence,
        });
      }
      showToast(main, "success");
      setOpen(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-2 min-h-[48px] w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-premium-gold/45";

  const cardClass =
    variant === "dashboard"
      ? "rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
      : "rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6";

  return (
    <section className={cardClass} id="mortgage-hub" aria-labelledby="mortgage-hub-heading">
      <h2 id="mortgage-hub-heading" className="text-lg font-semibold text-white">
        Mortgage evaluation
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Share a few numbers — we&apos;ll route you to a licensed mortgage partner (informational; not a commitment).
      </p>

      {variant === "analyze" ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
          {isLoggedIn ? (
            <Link
              href="/dashboard#mortgage-hub"
              className="text-sm font-semibold text-premium-gold underline decoration-premium-gold/50 underline-offset-2 hover:text-premium-gold"
            >
              Open mortgage dashboard
            </Link>
          ) : null}
          <Link
            href="/mortgage?from=analyze#request-contact"
            className="text-sm font-medium text-slate-300 underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            Mortgage hub — request contact
          </Link>
        </div>
      ) : null}

      {!isLoggedIn ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
          <Link
            href={`/auth/login?next=${encodeURIComponent(variant === "analyze" ? "/analyze#mortgage-hub" : "/dashboard#mortgage-hub")}`}
            className="font-semibold text-premium-gold underline hover:text-premium-gold"
          >
            Sign in
          </Link>{" "}
          to request a mortgage evaluation and see your assigned expert.
        </div>
      ) : loading ? (
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-white/[0.04]" aria-hidden />
      ) : (
        <div className="mt-5 space-y-5">
          {submitSuccess ? (
            <div
              className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-4 text-sm text-emerald-50"
              role="status"
            >
              <p className="font-medium leading-relaxed">{submitSuccess.main}</p>
              {submitSuccess.hint ? (
                <p className="mt-2 leading-relaxed text-emerald-100/90">{submitSuccess.hint}</p>
              ) : null}
            </div>
          ) : null}
          {displayedPreApproval ? <PreApprovalEstimateCard estimate={displayedPreApproval} /> : null}
          {displayedPreApproval ? (
            <MortgageAiInsightCard
              loading={mortgageInsightLoading}
              text={mortgageInsight}
              source={mortgageInsightSource}
            />
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-primary w-full min-h-[44px] sm:w-auto"
          >
            Request Mortgage Evaluation
          </button>

          {data?.broker ? (
            <div className="rounded-2xl border border-premium-gold/30 bg-[#14110a]/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-white">Talk to a Mortgage Expert</h3>
                {data.broker.isTopBroker ? (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-200 ring-1 ring-amber-500/40">
                    Top Broker
                  </span>
                ) : null}
              </div>
              {data.request ? (
                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(data.request.status)}`}
                  >
                    {data.request.status}
                  </span>
                  {data.request.intentLevel ? (
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-950/30 px-2 py-0.5 text-[11px] font-semibold uppercase text-emerald-200/90">
                      {data.request.intentLevel} intent
                    </span>
                  ) : null}
                  <span className="text-slate-500">
                    · {formatCurrencyCAD(data.request.propertyPrice)} ·{" "}
                    {new Date(data.request.createdAt).toLocaleDateString()}
                  </span>
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <span className="text-amber-300" aria-hidden>
                    ★
                  </span>
                  <span className="font-medium text-slate-200">
                    {data.broker.totalReviews > 0 ? data.broker.rating.toFixed(1) : "New"}
                  </span>
                  <span className="text-slate-500">
                    (
                    {data.broker.totalReviews > 0
                      ? `${data.broker.totalReviews} review${data.broker.totalReviews === 1 ? "" : "s"}`
                      : "no reviews yet"}
                    )
                  </span>
                </span>
                <span className="text-slate-600">·</span>
                <span>
                  Responds in{" "}
                  <span className="text-slate-300">{formatBrokerResponseTimeLabel(data.broker.responseTimeAvg)}</span>
                </span>
                <span className="text-slate-600">·</span>
                <span>
                  <span className="font-medium text-slate-300">{data.broker.totalLeadsHandled}</span> clients served
                </span>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500">Name</dt>
                  <dd className="font-medium text-white">{data.broker.name}</dd>
                </div>
                {data.broker.company ? (
                  <div>
                    <dt className="text-slate-500">Company</dt>
                    <dd className="text-slate-200">{data.broker.company}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd>
                    <a href={`mailto:${data.broker.email}`} className="text-premium-gold hover:underline">
                      {data.broker.email}
                    </a>
                  </dd>
                </div>
                {data.broker.phone ? (
                  <div>
                    <dt className="text-slate-500">Phone</dt>
                    <dd>
                      <a href={`tel:${data.broker.phone.replace(/\s/g, "")}`} className="text-premium-gold hover:underline">
                        {data.broker.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
              <a
                href={`mailto:${data.broker.email}?subject=${encodeURIComponent("Mortgage inquiry — LECIPM")}`}
                className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border-2 border-premium-gold bg-transparent px-4 py-3 text-sm font-semibold text-premium-gold transition hover:bg-premium-gold/10 sm:w-auto"
              >
                Contact Broker
              </a>
              {data.pendingBrokerReview && data.request ? (
                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-sm font-semibold text-white">Rate your broker experience</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Your broker marked this request as contacted or approved — tell us how it went.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1" role="group" aria-label="Star rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setReviewRating(n)}
                        className={`rounded-lg px-2 py-1 text-lg leading-none transition ${
                          n <= reviewRating ? "text-amber-400" : "text-slate-600"
                        }`}
                        aria-label={`${n} stars`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <label className="mt-3 block text-xs text-slate-500" htmlFor="broker-review-comment">
                    Comment (optional)
                  </label>
                  <textarea
                    id="broker-review-comment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-600"
                    placeholder="How was the experience?"
                  />
                  <button
                    type="button"
                    disabled={reviewSubmitting}
                    onClick={() => void submitBrokerReview()}
                    className="btn-primary mt-3 min-h-[44px] w-full sm:w-auto"
                  >
                    {reviewSubmitting ? "Submitting…" : "Submit review"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mortgage-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-[#121212] p-5 shadow-2xl sm:p-6">
            <h3 id="mortgage-modal-title" className="text-lg font-semibold text-white">
              Mortgage evaluation
            </h3>
            <p className="mt-1 text-sm text-slate-400">All amounts in CAD.</p>
            <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-4">
              <div>
                <label htmlFor="mortgage-price" className="text-sm font-medium text-slate-200">
                  Property price
                </label>
                <input
                  id="mortgage-price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={1000}
                  required
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="mortgage-down" className="text-sm font-medium text-slate-200">
                  Down payment
                </label>
                <input
                  id="mortgage-down"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={1000}
                  required
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="mortgage-income" className="text-sm font-medium text-slate-200">
                  Annual household income
                </label>
                <input
                  id="mortgage-income"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={1000}
                  required
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="mortgage-timeline" className="text-sm font-medium text-slate-200">
                  When do you plan to buy?
                </label>
                <select
                  id="mortgage-timeline"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className={`${inputClass} cursor-pointer bg-[#0B0B0B]`}
                >
                  <option value="immediate">ASAP / immediately</option>
                  <option value="1-3 months">Within 1–3 months</option>
                  <option value="3+ months">3+ months</option>
                </select>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-200">Have you been pre-approved?</span>
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                    <input
                      type="radio"
                      name="preApproved"
                      checked={preApproved === "yes"}
                      onChange={() => setPreApproved("yes")}
                      className="h-4 w-4 accent-premium-gold"
                    />
                    Yes
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                    <input
                      type="radio"
                      name="preApproved"
                      checked={preApproved === "no"}
                      onChange={() => setPreApproved("no")}
                      className="h-4 w-4 accent-premium-gold"
                    />
                    No
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="min-h-[44px] rounded-xl border border-white/20 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/5"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[44px] rounded-xl bg-premium-gold px-4 py-3 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
