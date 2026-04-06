"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "bnhub_listings" | "travel_inspiration" | "re_investment" | "platform_awareness" | "trust_reviews";

const PLATFORMS = ["Instagram", "TikTok", "LinkedIn", "X", "Facebook", "Threads"];

const PUBLISH_CHANNELS = ["instagram", "linkedin", "facebook", "tiktok", "x", "threads", "email"] as const;
type PublishChannel = (typeof PUBLISH_CHANNELS)[number];

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "bnhub_listings", label: "BNHub listings" },
  { value: "travel_inspiration", label: "Travel inspiration" },
  { value: "re_investment", label: "Real estate investment" },
  { value: "platform_awareness", label: "Platform awareness" },
  { value: "trust_reviews", label: "Trust & reviews" },
];

function StatusBadge({ status }: { status: string }) {
  const cls =
    {
      DRAFT: "bg-slate-700/90 text-slate-100",
      APPROVED: "bg-blue-900/70 text-blue-100",
      SCHEDULED: "bg-amber-900/60 text-amber-100",
      PUBLISHED: "bg-emerald-900/50 text-emerald-100",
      PUBLISHING: "bg-violet-900/60 text-violet-100",
      FAILED: "bg-rose-900/50 text-rose-100",
    }[status] ?? "bg-slate-800 text-slate-300";
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>{status}</span>
  );
}

type DraftRow = {
  id: string;
  type: string;
  topic: string | null;
  status: string;
  preview: string;
  scheduledAt: string | null;
  createdAt: string;
  isEmailCampaign: boolean;
  emailSubject: string | null;
  publishChannel: string | null;
  publishDryRun: boolean;
  parentContentId: string | null;
  isVariant: boolean;
  variantLabel: string | null;
  isWinnerVariant: boolean;
};

type PublishJobRow = {
  id: string;
  channel: string;
  status: string;
  dryRun: boolean;
  responseSummary: string | null;
  errorMessage: string | null;
  externalPostId: string | null;
  createdAt: string;
  finishedAt: string | null;
};

export function MarketingAiClient() {
  const [topic, setTopic] = useState("BNHub stays & LECIPM");
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("professional");
  const [audience, setAudience] = useState("travelers & hosts");
  const [theme, setTheme] = useState<Theme>("platform_awareness");
  const [context, setContext] = useState("");
  const [emailKind, setEmailKind] = useState<"partnership" | "onboarding" | "promotional">("promotional");
  const [partnerType, setPartnerType] = useState("");
  const [stage, setStage] = useState<"pre_launch" | "early" | "growth">("early");
  const [pastPerformance, setPastPerformance] = useState("");
  const [channelNotes, setChannelNotes] = useState("");
  const [priorHighPerformingExamples, setPriorHighPerformingExamples] = useState("");
  const [bestThemes, setBestThemes] = useState<Theme[]>([]);
  const [saveDraft, setSaveDraft] = useState(true);
  const [variantCount, setVariantCount] = useState<1 | 2 | 3>(1);
  const [isEmailCampaign, setIsEmailCampaign] = useState(false);

  const [output, setOutput] = useState("");
  const [meta, setMeta] = useState<{ source?: string; kind?: string }>({});
  const [lastContentId, setLastContentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [scheduleById, setScheduleById] = useState<string | null>(null);
  const [scheduleWhen, setScheduleWhen] = useState("");

  const [mViews, setMViews] = useState("");
  const [mClicks, setMClicks] = useState("");
  const [mConv, setMConv] = useState("");
  const [mOpens, setMOpens] = useState("");
  const [mNotes, setMNotes] = useState("");

  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<{
    id: string;
    content: string;
    type: string;
    status: string;
    topic: string | null;
    tone: string | null;
    audience: string | null;
    platform: string | null;
    theme: string | null;
    aiSource: string | null;
    scheduledAt: string | null;
    createdAt: string;
    emailSubject: string | null;
    emailBody: string | null;
    emailCta: string | null;
    isEmailCampaign: boolean;
    publishChannel: string | null;
    publishTargetId: string | null;
    publishDryRun: boolean;
    publishJobs: PublishJobRow[];
    parentContentId: string | null;
    isVariant: boolean;
    variantLabel: string | null;
    isWinnerVariant: boolean;
    childVariants: {
      id: string;
      variantLabel: string | null;
      isWinnerVariant: boolean;
      status: string;
      preview: string;
      createdAt: string;
    }[];
    metrics: {
      id: string;
      views: number | null;
      clicks: number | null;
      conversions: number | null;
      opens: number | null;
      notes: string | null;
      createdAt: string;
    }[];
  } | null>(null);

  const [analytics, setAnalytics] = useState<{
    summary: {
      totalViews: number;
      totalClicks: number;
      totalConversions: number;
      totalOpens: number;
      ctrPercent: number | null;
      conversionPercent: number | null;
      openRatePercent: number | null;
    };
    performanceBand: string;
    suggestions: string[];
    variantCompare: {
      ranking: {
        contentId: string;
        label: string;
        isWinnerVariant: boolean;
        ctrPercent: number | null;
        totalViews: number;
        totalClicks: number;
        totalConversions: number;
      }[];
    } | null;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [pubChannel, setPubChannel] = useState<PublishChannel | "">("");
  const [pubTarget, setPubTarget] = useState("");
  const [pubContentDryRun, setPubContentDryRun] = useState(true);
  const [pubRunDryRun, setPubRunDryRun] = useState(true);
  const [publishLoading, setPublishLoading] = useState(false);
  const [runScheduledLoading, setRunScheduledLoading] = useState(false);

  const feedbackPayload = useCallback(() => {
    const themes = bestThemes.length ? bestThemes : undefined;
    const perf = pastPerformance.trim() || undefined;
    const ch = channelNotes.trim() || undefined;
    const ex = priorHighPerformingExamples.trim() || undefined;
    if (!themes && !perf && !ch && !ex) return {};
    return {
      ...(perf ? { pastPerformance: perf } : {}),
      ...(themes ? { bestThemes: themes } : {}),
      ...(ch ? { channelNotes: ch } : {}),
      ...(ex ? { priorHighPerformingExamples: ex } : {}),
    };
  }, [pastPerformance, bestThemes, channelNotes, priorHighPerformingExamples]);

  const basePayload = useCallback(
    () => ({
      topic,
      platform,
      tone,
      audience,
      context: context.trim() || undefined,
      theme,
      saveDraft,
      save: saveDraft,
      variantCount,
      ...feedbackPayload(),
    }),
    [topic, platform, tone, audience, context, theme, saveDraft, variantCount, feedbackPayload]
  );

  const loadDrafts = useCallback(async () => {
    setDraftsLoading(true);
    try {
      const q = new URLSearchParams();
      if (filterType) q.set("type", filterType);
      if (filterStatus) q.set("status", filterStatus);
      const res = await fetch(`/api/marketing/content?${q.toString()}`);
      const data = (await res.json()) as { ok?: boolean; items?: DraftRow[] };
      if (res.ok && data.ok !== false && data.items) setDrafts(data.items);
    } finally {
      setDraftsLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/marketing/content/${id}`);
      const data = (await res.json()) as {
        ok?: boolean;
        item?: {
          content: string;
          type: string;
          status: string;
          topic: string | null;
          tone: string | null;
          audience: string | null;
          platform: string | null;
          theme: string | null;
          aiSource: string | null;
          scheduledAt: string | null;
          createdAt: string;
          emailSubject: string | null;
          emailBody: string | null;
          emailCta: string | null;
          isEmailCampaign: boolean;
          metrics: {
            id: string;
            views: number | null;
            clicks: number | null;
            conversions: number | null;
            notes: string | null;
            createdAt: string;
          }[];
        };
      };
      if (res.ok && data.ok !== false && data.item) {
        const it = data.item as {
          id: string;
          content: string;
          type: string;
          status: string;
          topic: string | null;
          tone: string | null;
          audience: string | null;
          platform: string | null;
          theme: string | null;
          aiSource: string | null;
          scheduledAt: string | null;
          createdAt: string;
          emailSubject: string | null;
          emailBody: string | null;
          emailCta: string | null;
          isEmailCampaign: boolean;
          publishChannel?: string | null;
          publishTargetId?: string | null;
          publishDryRun?: boolean;
          publishJobs?: PublishJobRow[];
          parentContentId?: string | null;
          isVariant?: boolean;
          variantLabel?: string | null;
          isWinnerVariant?: boolean;
          childVariants?: {
            id: string;
            variantLabel: string | null;
            isWinnerVariant: boolean;
            status: string;
            preview: string;
            createdAt: string;
          }[];
          metrics?: {
            id: string;
            views: number | null;
            clicks: number | null;
            conversions: number | null;
            opens?: number | null;
            notes: string | null;
            createdAt: string;
          }[];
        };
        setDetail({
          id: it.id,
          content: it.content,
          type: it.type,
          status: it.status,
          topic: it.topic,
          tone: it.tone,
          audience: it.audience,
          platform: it.platform,
          theme: it.theme,
          aiSource: it.aiSource,
          scheduledAt: it.scheduledAt,
          createdAt: it.createdAt,
          emailSubject: it.emailSubject,
          emailBody: it.emailBody,
          emailCta: it.emailCta,
          isEmailCampaign: it.isEmailCampaign,
          publishChannel: it.publishChannel ?? null,
          publishTargetId: it.publishTargetId ?? null,
          publishDryRun: it.publishDryRun !== false,
          publishJobs: it.publishJobs ?? [],
          parentContentId: it.parentContentId ?? null,
          isVariant: it.isVariant === true,
          variantLabel: it.variantLabel ?? null,
          isWinnerVariant: it.isWinnerVariant === true,
          childVariants: it.childVariants ?? [],
          metrics: (it.metrics ?? []).map((m) => ({
            id: m.id,
            views: m.views,
            clicks: m.clicks,
            conversions: m.conversions,
            opens: m.opens ?? null,
            notes: m.notes,
            createdAt: m.createdAt,
          })),
        });
      }
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async (id: string) => {
    setAnalyticsLoading(true);
    setAnalytics(null);
    try {
      const res = await fetch(`/api/marketing/analytics/content/${id}`);
      const data = (await res.json()) as {
        ok?: boolean;
        summary?: {
          totalViews: number;
          totalClicks: number;
          totalConversions: number;
          totalOpens: number;
          ctrPercent: number | null;
          conversionPercent: number | null;
          openRatePercent: number | null;
        };
        performanceBand?: string;
        suggestions?: string[];
        variantCompare?: { ranking: { contentId: string; label: string; isWinnerVariant: boolean; ctrPercent: number | null; totalViews: number; totalClicks: number; totalConversions: number }[] } | null;
      };
      if (res.ok && data.ok !== false && data.summary) {
        setAnalytics({
          summary: data.summary,
          performanceBand: data.performanceBand ?? "average",
          suggestions: data.suggestions ?? [],
          variantCompare: data.variantCompare ?? null,
        });
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  useEffect(() => {
    if (!detailModalOpen) {
      setAnalytics(null);
      return;
    }
    if (!detail) return;
    const analyticsId = detail.parentContentId ?? detail.id;
    void loadAnalytics(analyticsId);
  }, [detailModalOpen, detail?.id, detail?.parentContentId, loadAnalytics]);

  const abParentId =
    detail && !detail.isVariant && detail.childVariants.length > 0
      ? detail.id
      : detail?.isVariant && detail.parentContentId
        ? detail.parentContentId
        : null;

  useEffect(() => {
    if (!detail) return;
    const ch = detail.publishChannel ?? "";
    setPubChannel((PUBLISH_CHANNELS as readonly string[]).includes(ch) ? (ch as PublishChannel) : "");
    setPubTarget(detail.publishTargetId ?? "");
    setPubContentDryRun(detail.publishDryRun);
    setPubRunDryRun(true);
  }, [detail]);

  const copyOutput = useCallback(() => {
    if (!output) return;
    void navigator.clipboard.writeText(output);
  }, [output]);

  function toggleBestTheme(t: Theme) {
    setBestThemes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function runPost(path: string, body: Record<string, unknown>, label: string) {
    setLoading(true);
    setError(null);
    setMeta({ kind: label });
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok || data.ok === false) {
        const err =
          typeof data.error === "string" ? data.error : `Request failed (${res.status})`;
        setError(err);
        setOutput("");
        setLastContentId(null);
        return;
      }
      if (typeof data.source === "string") {
        setMeta({ kind: label, source: data.source });
      }
      const cid = typeof data.contentId === "string" ? data.contentId : null;
      const parentId = typeof data.parentContentId === "string" ? data.parentContentId : null;
      const variants = data.variants as
        | {
            label: string;
            text?: string;
            subject?: string;
            body?: string;
            cta?: string;
            ideas?: string[];
          }[]
        | undefined;

      if (variants && Array.isArray(variants) && variants.length > 1) {
        setLastContentId(parentId ?? cid);
        if (path.endsWith("/email")) {
          setOutput(
            variants
              .map(
                (v) =>
                  `${v.label}: Subject: ${v.subject ?? ""}\n\n${v.body ?? ""}\n\nCTA: ${v.cta ?? ""}`
              )
              .join("\n\n---\n\n")
          );
        } else if (path.endsWith("/growth-ideas")) {
          setOutput(
            variants
              .map((v) => `${v.label}:\n${v.text ?? (v.ideas ?? []).map((x, i) => `${i + 1}. ${x}`).join("\n")}`)
              .join("\n\n---\n\n")
          );
        } else {
          setOutput(variants.map((v) => `${v.label}: ${v.text ?? ""}`).join("\n\n---\n\n"));
        }
      } else {
        setLastContentId(cid);
        if (path.endsWith("/email")) {
          const subj = typeof data.subject === "string" ? data.subject : "";
          const bodyText = typeof data.body === "string" ? data.body : "";
          const cta = typeof data.cta === "string" ? data.cta : "";
          setOutput(`Subject: ${subj}\n\n${bodyText}\n\nCTA: ${cta}`);
        } else if (path.endsWith("/growth-ideas")) {
          if (typeof data.text === "string" && data.text.trim()) {
            setOutput(data.text);
          } else {
            const ideas = Array.isArray(data.ideas) ? data.ideas : [];
            setOutput(ideas.map((x, i) => `${i + 1}. ${String(x)}`).join("\n"));
          }
        } else {
          setOutput(typeof data.text === "string" ? data.text : "");
        }
      }
      if (saveDraft) void loadDrafts();
    } catch {
      setError("Network error");
      setOutput("");
      setLastContentId(null);
    } finally {
      setLoading(false);
    }
  }

  async function patchStatus(id: string, status: string) {
    const res = await fetch(`/api/marketing/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    void loadDrafts();
    if (selectedId === id) void loadDetail(id);
  }

  async function submitSchedule(id: string) {
    if (!scheduleWhen) return;
    const res = await fetch("/api/marketing/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: id, scheduledAt: new Date(scheduleWhen).toISOString() }),
    });
    if (!res.ok) return;
    setScheduleById(null);
    setScheduleWhen("");
    void loadDrafts();
    if (selectedId === id) void loadDetail(id);
  }

  async function submitPublishSettings() {
    if (!selectedId) return;
    setPublishLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketing/content/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publishChannel: pubChannel || null,
          publishTargetId: pubTarget.trim() || null,
          publishDryRun: pubContentDryRun,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || j.ok === false) {
        setError(j.error ?? "Could not save publish settings");
        return;
      }
      void loadDetail(selectedId);
      void loadDrafts();
    } finally {
      setPublishLoading(false);
    }
  }

  async function submitPublishNow() {
    if (!selectedId) return;
    setPublishLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: selectedId,
          ...(pubChannel ? { channel: pubChannel } : {}),
          dryRun: pubRunDryRun,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || j.ok === false) {
        setError(j.error ?? "Publish failed");
        return;
      }
      void loadDetail(selectedId);
      void loadDrafts();
    } finally {
      setPublishLoading(false);
    }
  }

  async function submitRunScheduled() {
    setRunScheduledLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/run-scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; picked?: number };
      if (!res.ok || j.ok === false) {
        setError(j.error ?? "Run scheduled failed");
        return;
      }
      void loadDrafts();
      if (selectedId) void loadDetail(selectedId);
    } finally {
      setRunScheduledLoading(false);
    }
  }

  async function submitMetrics() {
    const id = selectedId ?? lastContentId;
    if (!id) {
      setError("Select a draft or generate with save enabled.");
      return;
    }
    const views = mViews === "" ? undefined : Number(mViews);
    const clicks = mClicks === "" ? undefined : Number(mClicks);
    const conversions = mConv === "" ? undefined : Number(mConv);
    const opens = mOpens === "" ? undefined : Number(mOpens);
    const notes = mNotes.trim();
    const hasMetric =
      (views !== undefined && !Number.isNaN(views)) ||
      (clicks !== undefined && !Number.isNaN(clicks)) ||
      (conversions !== undefined && !Number.isNaN(conversions)) ||
      (opens !== undefined && !Number.isNaN(opens)) ||
      notes.length > 0;
    if (!hasMetric) {
      setError("Enter at least one metric number, opens, or notes.");
      return;
    }
    const res = await fetch("/api/marketing/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: id,
        ...(views !== undefined && !Number.isNaN(views) ? { views } : {}),
        ...(clicks !== undefined && !Number.isNaN(clicks) ? { clicks } : {}),
        ...(conversions !== undefined && !Number.isNaN(conversions) ? { conversions } : {}),
        ...(opens !== undefined && !Number.isNaN(opens) ? { opens } : {}),
        ...(notes ? { notes } : {}),
      }),
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setError(j.error ?? "Track failed");
      return;
    }
    setError(null);
    setMViews("");
    setMClicks("");
    setMConv("");
    setMOpens("");
    setMNotes("");
    if (id) {
      void loadDetail(id);
      void loadAnalytics(id);
    }
  }

  async function submitMarkWinner(parentContentId: string, winningContentId: string) {
    const res = await fetch("/api/marketing/variants/winner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentContentId, winningContentId }),
    });
    const j = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || j.ok === false) {
      setError(j.error ?? "Could not set winner");
      return;
    }
    setError(null);
    void loadDetail(selectedId ?? parentContentId);
    void loadAnalytics(parentContentId);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 text-slate-100">
      <div className="rounded-xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-sm font-semibold text-white">Generate</h2>
        <p className="mt-1 text-xs text-slate-500">
          Check &quot;Save as draft&quot; to store in DB. Feedback fields nudge the model — paste real notes, no API keys
          here.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-xs text-slate-400 sm:col-span-2">
            <input
              type="checkbox"
              checked={saveDraft}
              onChange={(e) => setSaveDraft(e.target.checked)}
              className="rounded border-white/20"
            />
            Save as draft after generate
          </label>
          <label className="block text-xs text-slate-400 sm:col-span-2">
            A/B variants (1–3 rows: parent = A, children B/C)
            <select
              className="mt-1 w-full max-w-xs rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={variantCount}
              onChange={(e) => setVariantCount(Number(e.target.value) as 1 | 2 | 3)}
            >
              <option value={1}>1 (no split)</option>
              <option value={2}>2 variants</option>
              <option value={3}>3 variants</option>
            </select>
          </label>
          <label className="block text-xs text-slate-400">
            Topic
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-emerald-500/40 focus:ring-2"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </label>
          <label className="block text-xs text-slate-400">
            Platform
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-emerald-500/40 focus:ring-2"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-400">
            Tone
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-emerald-500/40 focus:ring-2"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            />
          </label>
          <label className="block text-xs text-slate-400">
            Audience
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-emerald-500/40 focus:ring-2"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </label>
          <label className="block text-xs text-slate-400 sm:col-span-2">
            Content theme
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-emerald-500/40 focus:ring-2"
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
            >
              {THEME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-400 sm:col-span-2">
            Extra context (optional)
            <textarea
              className="mt-1 min-h-[72px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-emerald-500/40 focus:ring-2"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </label>
          <label className="block text-xs text-slate-400 sm:col-span-2">
            Past performance / what worked (optional)
            <textarea
              className="mt-1 min-h-[56px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-emerald-500/40 focus:ring-2"
              value={pastPerformance}
              onChange={(e) => setPastPerformance(e.target.value)}
              placeholder="e.g. Reels with host clips +15% saves; LinkedIn posts flat."
            />
          </label>
          <label className="block text-xs text-slate-400 sm:col-span-2">
            Channel-specific notes (optional)
            <textarea
              className="mt-1 min-h-[48px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-emerald-500/40 focus:ring-2"
              value={channelNotes}
              onChange={(e) => setChannelNotes(e.target.value)}
              placeholder="e.g. TikTok: hook in 1s; LinkedIn: no hashtag spam."
            />
          </label>
          <label className="block text-xs text-slate-400 sm:col-span-2">
            Prior high-performing examples (optional)
            <textarea
              className="mt-1 min-h-[48px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-emerald-500/40 focus:ring-2"
              value={priorHighPerformingExamples}
              onChange={(e) => setPriorHighPerformingExamples(e.target.value)}
              placeholder="Paste short excerpts or describe patterns — do not paste secrets."
            />
          </label>
          <div className="sm:col-span-2">
            <p className="text-xs text-slate-500">Best-performing themes (optional)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {THEME_OPTIONS.map((o) => (
                <label key={o.value} className="flex cursor-pointer items-center gap-1.5 rounded border border-white/10 px-2 py-1 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={bestThemes.includes(o.value)}
                    onChange={() => toggleBestTheme(o.value)}
                    className="rounded border-white/20"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-xs font-medium text-slate-500">Email-only</p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <label className="text-xs text-slate-400">
              Kind
              <select
                className="ml-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
                value={emailKind}
                onChange={(e) => setEmailKind(e.target.value as typeof emailKind)}
              >
                <option value="partnership">Partnership</option>
                <option value="onboarding">Onboarding</option>
                <option value="promotional">Promotional</option>
              </select>
            </label>
            <label className="text-xs text-slate-400">
              Partner type
              <input
                className="ml-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
                value={partnerType}
                onChange={(e) => setPartnerType(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={isEmailCampaign}
                onChange={(e) => setIsEmailCampaign(e.target.checked)}
                className="rounded border-white/20"
              />
              Email campaign (future send)
            </label>
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-xs font-medium text-slate-500">Growth ideas — stage</p>
          <select
            className="mt-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={stage}
            onChange={(e) => setStage(e.target.value as typeof stage)}
          >
            <option value="pre_launch">Pre-launch</option>
            <option value="early">Early</option>
            <option value="growth">Growth</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => runPost("/api/ai/social-post", basePayload(), "Social post")}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Generate post
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => runPost("/api/ai/caption", basePayload(), "Caption")}
          className="rounded-lg border border-emerald-500/40 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-950/50 disabled:opacity-50"
        >
          Generate caption
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            runPost(
              "/api/ai/email",
              {
                topic,
                tone,
                audience,
                context: context.trim() || undefined,
                emailKind,
                partnerType: partnerType.trim() || undefined,
                saveDraft,
                isEmailCampaign,
                variantCount,
                ...feedbackPayload(),
              },
              "Email"
            )
          }
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5 disabled:opacity-50"
        >
          Generate email
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            runPost(
              "/api/ai/growth-ideas",
              {
                topic,
                audience,
                tone,
                context: context.trim() || undefined,
                stage,
                saveDraft,
                variantCount,
                ...feedbackPayload(),
              },
              "Growth ideas"
            )
          }
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5 disabled:opacity-50"
        >
          Generate growth ideas
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Generating…</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white">Output</h2>
            {meta.kind && (
              <p className="text-xs text-slate-500">
                {meta.kind}
                {meta.source ? ` · ${meta.source}` : ""}
                {lastContentId ? ` · saved: ${lastContentId}` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={copyOutput}
            disabled={!output}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5 disabled:opacity-40"
          >
            Copy
          </button>
        </div>
        <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-200">
          {output || "—"}
        </pre>
      </div>

      <section className="rounded-xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-sm font-semibold text-white">Publishing pipeline</h2>
        <p className="mt-1 text-xs text-slate-500">
          Approved or scheduled content only. Default is <strong className="text-slate-400">dry-run</strong> — no live
          social APIs; email sends only when Resend + <code className="text-slate-400">MARKETING_EMAIL_LIVE_SEND=1</code>{" "}
          are set. Vercel cron <code className="text-slate-400">/api/cron/marketing-publish-due</code> runs{" "}
          <strong className="text-slate-400">live-intent</strong> rows only (<code className="text-slate-400">publishDryRun=false</code>
          ).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={runScheduledLoading}
            onClick={() => void submitRunScheduled()}
            className="rounded-lg border border-violet-500/40 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-950/40 disabled:opacity-50"
          >
            {runScheduledLoading ? "Running…" : "Run due scheduled publishes"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-black/30 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Drafts & schedule</h2>
            <p className="text-xs text-slate-500">Approve, set channel, schedule, publish (dry-run or live), metrics.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadDrafts()}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            Refresh
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="text-xs text-slate-400">
            <span className="block text-slate-500">Filter by type</span>
            <select
              className="ml-2 rounded border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All</option>
              <option value="social_post">Social</option>
              <option value="caption">Caption</option>
              <option value="email">Email</option>
              <option value="growth_idea">Growth</option>
            </select>
          </label>
          <label className="text-xs text-slate-400">
            <span className="block text-slate-500">Filter by status</span>
            <select
              className="ml-2 rounded border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHING">Publishing</option>
              <option value="PUBLISHED">Published</option>
              <option value="FAILED">Failed</option>
            </select>
          </label>
        </div>

        {draftsLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {drafts.map((d) => (
              <li
                key={d.id}
                className={`rounded-lg border p-3 text-sm ${
                  selectedId === d.id ? "border-emerald-500/50 bg-emerald-950/20" : "border-white/10 bg-black/20"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(d.id);
                    setDetailModalOpen(true);
                  }}
                  className="w-full text-left"
                >
                  <span className="font-medium text-slate-200">{d.type}</span>
                  <span className="ml-2 inline-block align-middle">
                    <StatusBadge status={d.status} />
                  </span>
                  {d.isVariant ? (
                    <span className="ml-2 text-[10px] uppercase text-sky-400/90">
                      var {d.variantLabel ?? "?"}
                    </span>
                  ) : null}
                  {d.isWinnerVariant ? (
                    <span className="ml-2 text-[10px] text-amber-400/90">★ winner</span>
                  ) : null}
                  {d.isEmailCampaign && <span className="ml-2 text-xs text-amber-400/90">campaign</span>}
                  {d.publishDryRun === false ? (
                    <span className="ml-2 text-[10px] uppercase text-amber-600/90">live-intent</span>
                  ) : (
                    <span className="ml-2 text-[10px] uppercase text-slate-500">dry-run default</span>
                  )}
                  {d.publishChannel && (
                    <span className="ml-2 text-[10px] text-slate-500">→ {d.publishChannel}</span>
                  )}
                  <div className="mt-1 line-clamp-2 text-xs text-slate-400">{d.preview}</div>
                  <div className="mt-1 text-[11px] text-slate-600">
                    {d.id} · {new Date(d.createdAt).toLocaleString()}
                    {d.scheduledAt ? ` · scheduled ${new Date(d.scheduledAt).toLocaleString()}` : ""}
                  </div>
                </button>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void patchStatus(d.id, "APPROVED")}
                    className="rounded border border-white/15 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void patchStatus(d.id, "PUBLISHED")}
                    className="rounded border border-white/15 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                  >
                    Mark published
                  </button>
                  {d.type === "email" && (
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/marketing/content/${d.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isEmailCampaign: true }),
                        });
                        void loadDrafts();
                      }}
                      className="rounded border border-amber-500/30 px-2 py-1 text-xs text-amber-200/90 hover:bg-amber-950/30"
                    >
                      Mark campaign
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleById(scheduleById === d.id ? null : d.id);
                      setScheduleWhen("");
                    }}
                    className="rounded border border-emerald-500/30 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-950/30"
                  >
                    Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(d.preview)}
                    className="rounded border border-white/10 px-2 py-1 text-xs text-slate-400 hover:bg-white/5"
                  >
                    Copy preview
                  </button>
                </div>
                {scheduleById === d.id && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/5 pt-2">
                    <input
                      type="datetime-local"
                      value={scheduleWhen}
                      onChange={(e) => setScheduleWhen(e.target.value)}
                      className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => void submitSchedule(d.id)}
                      className="rounded bg-emerald-700 px-2 py-1 text-xs text-white hover:bg-emerald-600"
                    >
                      Save schedule
                    </button>
                  </div>
                )}
              </li>
            ))}
            {drafts.length === 0 && <li className="text-sm text-slate-500">No drafts yet — generate with save enabled.</li>}
          </ul>
        )}

      </section>

      {detailModalOpen && selectedId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="presentation"
          onClick={() => setDetailModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl border border-white/15 bg-slate-950 shadow-2xl"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">Draft detail</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border border-white/15 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                  onClick={() => {
                    if (!detail) return;
                    const body =
                      detail.type === "email" && detail.emailBody != null
                        ? `Subject: ${detail.emailSubject ?? ""}\n\n${detail.emailBody}\n\nCTA: ${detail.emailCta ?? ""}`
                        : detail.content;
                    void navigator.clipboard.writeText(body);
                  }}
                >
                  Copy all
                </button>
                <button
                  type="button"
                  className="text-sm text-slate-400 hover:text-white"
                  onClick={() => setDetailModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="max-h-[calc(90vh-52px)] overflow-y-auto p-4">
              {detailLoading && <p className="text-sm text-slate-500">Loading…</p>}
              {!detailLoading && detail && (
                <div className="space-y-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={detail.status} />
                    <span className="text-slate-400">{detail.type}</span>
                    {detail.isEmailCampaign && (
                      <span className="text-xs text-amber-400/90">campaign</span>
                    )}
                  </div>
                  <dl className="grid grid-cols-1 gap-1 text-xs text-slate-400 sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-600">Topic</dt>
                      <dd className="text-slate-300">{detail.topic ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-600">Tone / audience</dt>
                      <dd className="text-slate-300">
                        {detail.tone ?? "—"} · {detail.audience ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-600">Platform / theme</dt>
                      <dd className="text-slate-300">
                        {detail.platform ?? "—"} · {detail.theme ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-600">Source / created</dt>
                      <dd className="text-slate-300">
                        {detail.aiSource ?? "—"} · {new Date(detail.createdAt).toLocaleString()}
                      </dd>
                    </div>
                    {detail.scheduledAt && (
                      <div className="sm:col-span-2">
                        <dt className="text-slate-600">Scheduled</dt>
                        <dd className="text-slate-300">{new Date(detail.scheduledAt).toLocaleString()}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-slate-600">Publish channel</dt>
                      <dd className="text-slate-300">{detail.publishChannel ?? "— (infer from type/platform)"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-600">Target / account hint</dt>
                      <dd className="text-slate-300">{detail.publishTargetId ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-600">Content dry-run default</dt>
                      <dd className="text-slate-300">{detail.publishDryRun ? "Yes (safe)" : "Live-intent"}</dd>
                    </div>
                  </dl>
                  <div className="space-y-2 border-t border-white/10 pt-3">
                    <p className="text-xs font-medium text-slate-400">Performance (aggregated)</p>
                    {analyticsLoading && <p className="text-[11px] text-slate-500">Loading analytics…</p>}
                    {!analyticsLoading && analytics && (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 sm:grid-cols-3">
                          <div>
                            Views <span className="text-slate-200">{analytics.summary.totalViews}</span>
                          </div>
                          <div>
                            Clicks <span className="text-slate-200">{analytics.summary.totalClicks}</span>
                          </div>
                          <div>
                            Conv <span className="text-slate-200">{analytics.summary.totalConversions}</span>
                          </div>
                          <div>
                            Opens <span className="text-slate-200">{analytics.summary.totalOpens}</span>
                          </div>
                          <div>
                            CTR <span className="text-slate-200">{analytics.summary.ctrPercent ?? "—"}%</span>
                          </div>
                          <div>
                            Conv/clk{" "}
                            <span className="text-slate-200">{analytics.summary.conversionPercent ?? "—"}%</span>
                          </div>
                          <div>
                            Open/view{" "}
                            <span className="text-slate-200">{analytics.summary.openRatePercent ?? "—"}%</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          vs peers (same type):{" "}
                          <span className="font-semibold text-slate-300">
                            {analytics.performanceBand === "top"
                              ? "Top performer"
                              : analytics.performanceBand === "low"
                                ? "Low performance"
                                : "Average"}
                          </span>
                        </p>
                        {analytics.suggestions.length > 0 && (
                          <ul className="list-inside list-disc text-[11px] text-amber-200/80">
                            {analytics.suggestions.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                  {(Boolean(analytics?.variantCompare?.ranking?.length) || detail.childVariants.length > 0) && (
                    <div className="border-t border-white/10 pt-3 text-xs">
                      <p className="font-medium text-slate-400">A/B variants</p>
                      {analytics?.variantCompare?.ranking && analytics.variantCompare.ranking.length > 0 ? (
                        <ul className="mt-2 space-y-2">
                          {analytics.variantCompare.ranking.map((r, idx) => (
                            <li
                              key={r.contentId}
                              className={`rounded border px-2 py-1.5 ${
                                idx === 0
                                  ? "border-emerald-500/40 bg-emerald-950/20"
                                  : "border-white/10 bg-black/25"
                              }`}
                            >
                              <span className="text-slate-200">Variant {r.label}</span>
                              {r.isWinnerVariant ? (
                                <span className="ml-2 text-amber-400">★ winner</span>
                              ) : null}
                              <span className="ml-2 text-[11px] text-slate-500">
                                v{r.totalViews} · clk {r.totalClicks} · conv {r.totalConversions} · CTR{" "}
                                {r.ctrPercent ?? "—"}%
                              </span>
                              {abParentId ? (
                                <button
                                  type="button"
                                  className="ml-2 text-[10px] text-violet-300 hover:underline"
                                  onClick={() => void submitMarkWinner(abParentId, r.contentId)}
                                >
                                  Mark winner
                                </button>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="mt-2 space-y-1 text-[11px] text-slate-500">
                          {detail.childVariants.map((v) => (
                            <li key={v.id} className="flex flex-wrap items-center gap-2">
                              <span>
                                {v.variantLabel ?? "?"} · {v.preview.slice(0, 72)}
                                {v.isWinnerVariant ? " ★" : ""}
                              </span>
                              {abParentId ? (
                                <button
                                  type="button"
                                  className="text-violet-300 hover:underline"
                                  onClick={() => void submitMarkWinner(abParentId, v.id)}
                                >
                                  Mark winner
                                </button>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <div className="space-y-3 border-t border-white/10 pt-3">
                    <p className="text-xs font-medium text-slate-400">Publish actions</p>
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="text-xs text-slate-400">
                        Channel
                        <select
                          className="ml-1 block rounded border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
                          value={pubChannel}
                          onChange={(e) => setPubChannel(e.target.value as PublishChannel | "")}
                        >
                          <option value="">(auto)</option>
                          {PUBLISH_CHANNELS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs text-slate-400">
                        Target id
                        <input
                          className="ml-1 block w-40 rounded border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
                          value={pubTarget}
                          onChange={(e) => setPubTarget(e.target.value)}
                          placeholder="@handle / list id"
                        />
                      </label>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={pubContentDryRun}
                        onChange={(e) => setPubContentDryRun(e.target.checked)}
                        className="rounded border-white/20"
                      />
                      Keep dry-run as default for this content (uncheck = live-intent for cron)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-amber-200/90">
                      <input
                        type="checkbox"
                        checked={pubRunDryRun}
                        onChange={(e) => setPubRunDryRun(e.target.checked)}
                        className="rounded border-white/20"
                      />
                      Force dry-run for this run only
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={publishLoading}
                        onClick={() => void submitPublishSettings()}
                        className="rounded border border-white/20 px-2 py-1 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-50"
                      >
                        Save publish settings
                      </button>
                      <button
                        type="button"
                        disabled={publishLoading || detail.status === "DRAFT"}
                        onClick={() => void submitPublishNow()}
                        className="rounded bg-violet-700 px-2 py-1 text-xs font-medium text-white hover:bg-violet-600 disabled:opacity-50"
                      >
                        {publishLoading ? "…" : pubRunDryRun ? "Publish now (dry-run)" : "Publish now (live if configured)"}
                      </button>
                    </div>
                    {detail.status === "FAILED" && (
                      <button
                        type="button"
                        className="rounded border border-rose-500/40 px-2 py-1 text-xs text-rose-200"
                        onClick={() => void patchStatus(selectedId, "APPROVED")}
                      >
                        Reset to approved (retry)
                      </button>
                    )}
                  </div>
                  {detail.publishJobs.length > 0 && (
                    <div className="border-t border-white/10 pt-3 text-[11px] text-slate-500">
                      <p className="font-medium text-slate-400">Publish log (latest first)</p>
                      <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                        {detail.publishJobs.map((j) => (
                          <li key={j.id} className="rounded border border-white/5 bg-black/30 px-2 py-1">
                            <span className="text-slate-300">{j.channel}</span> ·{" "}
                            <span className="uppercase text-slate-400">{j.status}</span>
                            {j.dryRun ? " · simulated" : " · live path"}
                            {j.externalPostId ? ` · id ${j.externalPostId}` : ""}
                            <div className="text-slate-500">
                              {j.responseSummary ?? j.errorMessage ?? "—"} ·{" "}
                              {new Date(j.createdAt).toLocaleString()}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {detail.type === "email" && (
                    <div className="space-y-1 text-xs text-slate-300">
                      <p>
                        <span className="text-slate-500">Subject:</span> {detail.emailSubject ?? "—"}
                      </p>
                      <p>
                        <span className="text-slate-500">CTA:</span> {detail.emailCta ?? "—"}
                      </p>
                    </div>
                  )}
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/50 p-3 font-sans text-xs leading-relaxed text-slate-200">
                    {detail.type === "email" && detail.emailBody != null ? detail.emailBody : detail.content}
                  </pre>
                  {detail.metrics.length > 0 && (
                    <div className="text-[11px] text-slate-500">
                      <p className="font-medium text-slate-400">Recent metrics</p>
                      <ul className="mt-1 list-inside list-disc space-y-0.5">
                        {detail.metrics.slice(0, 8).map((m) => (
                          <li key={m.id}>
                            v{m.views ?? "—"} / c{m.clicks ?? "—"} / conv{m.conversions ?? "—"} / o
                            {m.opens ?? "—"}
                            {m.notes ? ` — ${m.notes.slice(0, 100)}` : ""} ·{" "}
                            {new Date(m.createdAt).toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      className="rounded border border-white/15 px-2 py-1 text-xs text-slate-200"
                      onClick={() => void patchStatus(selectedId, "PUBLISHED")}
                    >
                      Mark published
                    </button>
                    {detail.type === "email" && (
                      <button
                        type="button"
                        className="rounded border border-amber-500/30 px-2 py-1 text-xs text-amber-200/90"
                        onClick={async () => {
                          await fetch(`/api/marketing/content/${selectedId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ isEmailCampaign: true }),
                          });
                          void loadDrafts();
                          void loadDetail(selectedId);
                        }}
                      >
                        Mark campaign
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-sm font-semibold text-white">Manual metrics</h2>
        <p className="mt-1 text-xs text-slate-500">
          Append a snapshot for the selected draft (or last saved id). Use numbers and/or notes.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-400">
            Views
            <input
              className="ml-1 w-20 rounded border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
              value={mViews}
              onChange={(e) => setMViews(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-400">
            Clicks
            <input
              className="ml-1 w-20 rounded border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
              value={mClicks}
              onChange={(e) => setMClicks(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-400">
            Conversions
            <input
              className="ml-1 w-20 rounded border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
              value={mConv}
              onChange={(e) => setMConv(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-400">
            Opens (email)
            <input
              className="ml-1 w-20 rounded border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
              value={mOpens}
              onChange={(e) => setMOpens(e.target.value)}
            />
          </label>
        </div>
        <label className="mt-2 block text-xs text-slate-400">
          Notes (optional)
          <input
            className="mt-1 w-full max-w-md rounded border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
            value={mNotes}
            onChange={(e) => setMNotes(e.target.value)}
            placeholder="e.g. pulled from Meta Ads export 2026-04-01"
          />
        </label>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <button
            type="button"
            onClick={() => void submitMetrics()}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-600"
          >
            Log metrics
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-600">
          Target id: {selectedId ?? lastContentId ?? "none"}
        </p>
      </section>
    </div>
  );
}
