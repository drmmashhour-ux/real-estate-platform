"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ComplianceChecklistItemStatus, ComplianceVerificationLevel } from "@prisma/client";
import type { ChecklistItem } from "@prisma/client";
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  History,
  ShieldAlert,
  Upload,
  UserCheck
} from "lucide-react";

export type CoOwnershipCompliancePayload = {
  applies: boolean;
  listingType: string;
  isCoOwnership: boolean;
  items: Pick<
    ChecklistItem,
    | "id"
    | "key"
    | "label"
    | "status"
    | "required"
    | "category"
    | "priority"
    | "description"
    | "source"
    | "verificationLevel"
    | "verifiedAt"
    | "verifiedByUserId"
    | "supportingDocumentIds"
    | "validUntil"
    | "isExpired"
    | "isOverridden"
    | "overrideReason"
  >[];
  complete: boolean;
  certificateComplete: boolean;
  insuranceGateComplete: boolean;
  complianceReady: boolean;
  coownershipPercent?: number;
  insurancePercent?: number;
  overallPercent?: number;
  blockingIssues?: string[];
  warnings?: string[];
  recommendation?: string;
};

type ApiResponse = CoOwnershipCompliancePayload & {
  listingId?: string;
  applicable?: boolean;
  categories?: {
    coownership: { items: ChecklistItem[]; percent: number };
    insurance: { items: ChecklistItem[]; percent: number };
  };
};

type Props = {
  listingId: string;
  className?: string;
  refreshRouter?: boolean;
  onComplianceLoaded?: (payload: CoOwnershipCompliancePayload) => void;
};

function pctLabel(n: number | undefined) {
  return `${Math.round(n ?? 0)}%`;
}

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    CRITICAL: "bg-rose-500/15 text-rose-700 dark:text-rose-200 border-rose-500/30",
    HIGH: "bg-amber-500/15 text-amber-900 dark:text-amber-100 border-amber-500/30",
    MEDIUM: "bg-sky-500/15 text-sky-900 dark:text-sky-100 border-sky-500/30",
    LOW: "bg-slate-500/15 text-slate-700 dark:text-slate-200 border-slate-500/25",
  };
  return map[priority] ?? map.LOW;
}

function verificationBadge(level: ComplianceVerificationLevel) {
  const map: Record<ComplianceVerificationLevel, string> = {
    DECLARED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    DOCUMENTED: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    VERIFIED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };
  return (
    <span className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${map[level]}`}>
      {level === "VERIFIED" && <ShieldCheck className="h-2.5 w-2.5" />}
      {level === "DOCUMENTED" && <FileText className="h-2.5 w-2.5" />}
      {level}
    </span>
  );
}

export function CoOwnershipCompliancePanel({
  listingId,
  className = "",
  refreshRouter = false,
  onComplianceLoaded,
}: Props) {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/compliance/${encodeURIComponent(listingId)}`, { credentials: "same-origin" });
      const j = (await res.json().catch(() => ({}))) as ApiResponse & { error?: string };
      if (!res.ok) {
        setError(j.error ?? "Could not load compliance");
        setData(null);
        return;
      }
      setData(j);
      const payload: CoOwnershipCompliancePayload = {
        applies: j.applies,
        listingType: j.listingType,
        isCoOwnership: j.isCoOwnership,
        items: j.items,
        complete: j.complete,
        certificateComplete: j.certificateComplete,
        insuranceGateComplete: j.insuranceGateComplete,
        complianceReady: j.complianceReady,
        coownershipPercent: j.coownershipPercent,
        insurancePercent: j.insurancePercent,
        overallPercent: j.overallPercent,
        blockingIssues: j.blockingIssues,
        warnings: j.warnings,
        recommendation: j.recommendation,
      };
      onComplianceLoaded?.(payload);
    } catch {
      setError("Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [listingId, onComplianceLoaded]);

  const loadAudit = useCallback(async () => {
    if (!listingId) return;
    try {
      const res = await fetch(`/api/compliance/${encodeURIComponent(listingId)}/audit`);
      if (res.ok) {
        const j = await res.json();
        setAuditLogs(j.logs ?? []);
      }
    } catch {
      /* silent */
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (showAudit) void loadAudit();
  }, [showAudit, loadAudit]);

  const setStatus = async (key: string, status: ComplianceChecklistItemStatus) => {
    setUpdating(key);
    setError(null);
    try {
      const res = await fetch(`/api/compliance/${encodeURIComponent(listingId)}/check/${encodeURIComponent(key)}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Update failed");
        return;
      }
      await load();
      if (refreshRouter) router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setUpdating(null);
    }
  };

  if (loading && !data) {
    return (
      <div
        className={`rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 ${className}`}
      >
        Loading co-ownership compliance…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        className={`rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 ${className}`}
      >
        {error}
      </div>
    );
  }

  if (!data || !data.applies) {
    return null;
  }

  const insuranceCriticalMissing =
    data.categories?.insurance?.items?.some(
      (i) =>
        (i.key === "syndicate_property_insurance_verified" || i.key === "syndicate_third_party_liability_verified") &&
        i.status === "PENDING",
    ) ?? false;

  const coItems = data.categories?.coownership?.items ?? data.items.filter((i) => i.category === "COOWNERSHIP");
  const insItems = data.categories?.insurance?.items ?? data.items.filter((i) => i.category === "INSURANCE");

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-semibold">⚠️ Co-Ownership Compliance Required</p>
        <p className="mt-2 leading-relaxed">
          This property is a divided co-ownership. Verify the certificate of co-ownership condition, maintenance and
          financial documents, and mandatory insurance before proceeding — platform workflow only, not legal advice.
        </p>
      </div>

      {insuranceCriticalMissing ? (
        <div className="rounded-xl border border-rose-400/80 bg-rose-50 px-4 py-3 text-sm text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-100">
          <p className="font-semibold">⚠️ Insurance Verification Missing</p>
          <p className="mt-2 leading-relaxed">
            Mandatory syndicate or liability insurance has not been fully verified. This may expose buyers and co-owners
            to legal and financial risk.
          </p>
        </div>
      ) : null}

      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Co-Ownership Compliance</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Legal, operational, and insurance verification for divided co-ownership (Québec-focused checklist — not legal
          advice).
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Co-ownership
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
            {pctLabel(data.categories?.coownership?.percent ?? data.coownershipPercent)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Insurance</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
            {pctLabel(data.categories?.insurance?.percent ?? data.insurancePercent)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Overall</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{pctLabel(data.overallPercent)}</div>
        </div>
      </div>

      {(data.blockingIssues?.length ?? 0) > 0 ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-50 px-4 py-3 text-sm text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100">
          <p className="font-semibold">Blocking issues</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {data.blockingIssues!.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {(data.warnings?.length ?? 0) > 0 ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-semibold">Warnings</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {data.warnings!.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.recommendation ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100">
          <p className="font-medium">Recommendation</p>
          <p className="mt-2 leading-relaxed">{data.recommendation}</p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">1. Legal & co-ownership</h3>
        <ul className="space-y-2">
          {coItems.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${priorityBadge(item.priority)}`}>
                    {item.priority}
                  </span>
                  {item.required ? (
                    <span className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600 dark:border-slate-600 dark:text-slate-300">
                      Required
                    </span>
                  ) : (
                    <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] uppercase text-slate-500 dark:border-slate-700">
                      Conditional
                    </span>
                  )}
                  {verificationBadge(item.verificationLevel as any)}
                  {item.isExpired && (
                    <span className="flex items-center gap-1 rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-600">
                      <AlertTriangle className="h-2.5 w-2.5" /> Expired
                    </span>
                  )}
                  {item.isOverridden && (
                    <span className="flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-600">
                      <ShieldAlert className="h-2.5 w-2.5" /> Overridden
                    </span>
                  )}
                </div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{item.label}</div>
                {item.description ? (
                  <div className="text-xs text-slate-600 dark:text-slate-400">{item.description}</div>
                ) : null}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {item.source ? (
                    <div className="text-[10px] text-slate-500 dark:text-slate-500">Source: {item.source}</div>
                  ) : null}
                  {item.validUntil && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="h-2.5 w-2.5" />
                      Valid until: {new Date(item.validUntil).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  onClick={() => alert("Upload logic placeholder")}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  title="Upload supporting document"
                >
                  <Upload className="h-4 w-4" />
                </button>
                <select
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  disabled={updating === item.key}
                  value={item.status}
                  onChange={(e) =>
                    void setStatus(item.key, e.target.value as ComplianceChecklistItemStatus)
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NOT_APPLICABLE">Not applicable</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">2. Insurance verification</h3>
        <ul className="space-y-2">
          {insItems.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${priorityBadge(item.priority)}`}>
                    {item.priority}
                  </span>
                  {item.required ? (
                    <span className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600 dark:border-slate-600 dark:text-slate-300">
                      Required
                    </span>
                  ) : (
                    <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] uppercase text-slate-500 dark:border-slate-700">
                      Conditional
                    </span>
                  )}
                  {verificationBadge(item.verificationLevel as any)}
                  {item.isExpired && (
                    <span className="flex items-center gap-1 rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-600">
                      <AlertTriangle className="h-2.5 w-2.5" /> Expired
                    </span>
                  )}
                  {item.isOverridden && (
                    <span className="flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-600">
                      <ShieldAlert className="h-2.5 w-2.5" /> Overridden
                    </span>
                  )}
                </div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{item.label}</div>
                {item.description ? (
                  <div className="text-xs text-slate-600 dark:text-slate-400">{item.description}</div>
                ) : null}
                {item.validUntil && (
                  <div className="flex items-center gap-1 pt-1 text-[10px] text-slate-500">
                    <Clock className="h-2.5 w-2.5" />
                    Valid until: {new Date(item.validUntil).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  onClick={() => alert("Upload logic placeholder")}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  title="Upload supporting document"
                >
                  <Upload className="h-4 w-4" />
                </button>
                <select
                  className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  disabled={updating === item.key}
                  value={item.status}
                  onChange={(e) => void setStatus(item.key, e.target.value as ComplianceChecklistItemStatus)}
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="NOT_APPLICABLE">Not applicable</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
        <button
          onClick={() => setShowAudit(!showAudit)}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
        >
          <History className="h-3.5 w-3.5" />
          {showAudit ? "Hide Audit Trail" : "View Compliance Audit Trail"}
        </button>

        {showAudit && (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/50">
                <tr>
                  <th className="px-3 py-2 font-semibold">Event</th>
                  <th className="px-3 py-2 font-semibold">Actor</th>
                  <th className="px-3 py-2 font-semibold">Reason</th>
                  <th className="px-3 py-2 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-slate-400 italic">
                      No audit logs found for this listing.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{log.event}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{log.actor?.name ?? "System"}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{log.reason ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
