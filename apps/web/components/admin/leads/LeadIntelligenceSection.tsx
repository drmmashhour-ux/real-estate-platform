import { prisma } from "@/lib/db";
import { aiAutopilotFollowupFlags, aiAutopilotMessagingAssistFlags } from "@/config/feature-flags";
import { buildFollowUpQueue, leadRowToFollowUpInput } from "@/modules/growth/ai-autopilot-followup.service";
import { buildReplyDraftsForLeads } from "@/modules/growth/ai-autopilot-messaging-bulk.service";
import { leadRowToMessagingInput } from "@/modules/growth/ai-autopilot-messaging-mapper";
import type { AiMessagingAssistResult } from "@/modules/growth/ai-autopilot-messaging.types";
import { FollowUpLeadRowActions } from "./FollowUpLeadRowActions";
import { LeadMessagingAssistCell } from "./LeadMessagingAssistCell";

function tagChips(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.filter((t): t is string => typeof t === "string");
  return [];
}

function priorityBadgeClass(p: string | null): string {
  if (p === "high") return "border-amber-500/50 bg-amber-500/10 text-amber-100";
  if (p === "medium") return "border-slate-500/50 bg-slate-700/50 text-slate-200";
  return "border-slate-700 bg-slate-800/80 text-slate-400";
}

function followUpStatusBadge(status: string): string {
  if (status === "due_now") return "border-rose-500/40 bg-rose-950/30 text-rose-100";
  if (status === "waiting") return "border-sky-500/40 bg-sky-950/25 text-sky-100";
  if (status === "done") return "border-slate-600 bg-slate-800/80 text-slate-300";
  if (status === "queued") return "border-amber-500/40 bg-amber-950/20 text-amber-100";
  return "border-slate-600 bg-slate-800/80 text-slate-300";
}

function messagingAssistEmphasis(
  priority: string | null,
  chips: string[],
): { emphasize: boolean; label: string | null } {
  if (priority === "high") return { emphasize: true, label: "Draft ready" };
  if (chips.includes("needs_followup")) return { emphasize: true, label: "Needs follow-up" };
  return { emphasize: false, label: null };
}

function draftsByLeadId(drafts: AiMessagingAssistResult[]): Map<string, AiMessagingAssistResult> {
  return new Map(drafts.map((d) => [d.leadId, d]));
}

/**
 * CRM `Lead` rows — autopilot ai* layer (distinct from Early user tracking table).
 * Optional messaging assist column: draft-only suggested replies when `FEATURE_AI_AUTOPILOT_MESSAGING_ASSIST_V1` is on.
 */
export async function LeadIntelligenceSection() {
  const assistOn = aiAutopilotMessagingAssistFlags.messagingAssistV1;
  const followOn = aiAutopilotFollowupFlags.followupV1;
  const queueOn = aiAutopilotFollowupFlags.followupQueueV1;

  const recent = await prisma.lead.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      message: true,
      listingId: true,
      listingCode: true,
      aiScore: true,
      aiPriority: true,
      aiTags: true,
      createdAt: true,
      aiExplanation: true,
      lastContactedAt: true,
      launchSalesContacted: true,
      launchLastContactDate: true,
      pipelineStatus: true,
    },
  });

  const sorted = [...recent].sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1));
  const hot = sorted.filter((r) => r.aiPriority === "high").slice(0, 5);

  let draftMap: Map<string, AiMessagingAssistResult> = new Map();
  try {
    if (assistOn && recent.length > 0) {
      const inputs = recent.map(leadRowToMessagingInput);
      const drafts = buildReplyDraftsForLeads(inputs);
      draftMap = draftsByLeadId(drafts);
    }
  } catch {
    /* page still renders */
  }

  const assistReadyCount = assistOn ? draftMap.size : 0;

  let followQueue: ReturnType<typeof buildFollowUpQueue> = [];
  try {
    if (followOn) {
      const inputs = recent.map(leadRowToFollowUpInput);
      followQueue = buildFollowUpQueue(inputs, {
        remindersEnabled: aiAutopilotFollowupFlags.followupRemindersV1,
      });
    }
  } catch {
    /* page still renders */
  }

  const dueNowItems = followOn ? followQueue.filter((x) => x.status === "due_now").slice(0, 15) : [];
  const queueTop = followOn && queueOn ? followQueue.slice(0, 35) : [];

  return (
    <section className="space-y-8">
      {followOn ? (
        <p className="text-xs text-slate-500">
          Internal follow-up queue — prioritization for operators only. Nothing is sent to contacts from this view.
        </p>
      ) : null}

      {followOn && dueNowItems.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-rose-100/90">🔥 Due now</h2>
          <p className="mt-1 text-xs text-slate-500">Highest internal urgency (deterministic rules; not a send log).</p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-rose-500/20">
            <table className="w-full min-w-[720px] text-left text-sm text-slate-200">
              <thead className="border-b border-slate-700 bg-slate-900/80 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">aiPriority</th>
                  <th className="px-3 py-2">Follow-up</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Next</th>
                  <th className="px-3 py-2">Rationale</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dueNowItems.map((row) => (
                  <tr key={row.leadId} className="border-b border-slate-800">
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{row.email}</div>
                    </td>
                    <td className="px-3 py-2 text-xs">{row.aiPriority ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{row.followUpPriority}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${followUpStatusBadge(row.status)}`}
                      >
                        Due now
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{row.queueScore}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {row.nextActionAt ? new Date(row.nextActionAt).toLocaleString() : "—"}
                    </td>
                    <td className="max-w-[220px] px-3 py-2 text-[11px] text-slate-500">{row.rationale}</td>
                    <td className="px-3 py-2">
                      <FollowUpLeadRowActions leadId={row.leadId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {followOn && queueOn && queueTop.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-slate-200">⏳ Follow-Up Queue</h2>
          <p className="mt-1 text-xs text-slate-500">Sorted by queueScore (desc). Top {queueTop.length} of loaded leads.</p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full min-w-[900px] text-left text-sm text-slate-200">
              <thead className="border-b border-slate-700 bg-slate-900/80 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">aiPriority</th>
                  <th className="px-3 py-2">followUpPriority</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">queueScore</th>
                  <th className="px-3 py-2">nextActionAt</th>
                  <th className="px-3 py-2">reminderReason</th>
                  <th className="px-3 py-2">Rationale</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queueTop.map((row) => (
                  <tr key={row.leadId} className="border-b border-slate-800">
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium">{row.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{row.email}</div>
                    </td>
                    <td className="px-3 py-2 align-top text-xs">{row.aiPriority ?? "—"}</td>
                    <td className="px-3 py-2 align-top text-xs">{row.followUpPriority}</td>
                    <td className="px-3 py-2 align-top">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${followUpStatusBadge(row.status)}`}
                      >
                        {row.status === "due_now"
                          ? "Due now"
                          : row.status === "waiting"
                            ? "Waiting"
                            : row.status === "done"
                              ? "Done"
                              : row.status === "queued"
                                ? "Queued"
                                : "New"}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top font-mono text-xs">{row.queueScore}</td>
                    <td className="px-3 py-2 align-top text-xs text-slate-400">
                      {row.nextActionAt ? new Date(row.nextActionAt).toLocaleString() : "—"}
                    </td>
                    <td className="max-w-[200px] px-3 py-2 align-top text-[11px] text-slate-500">{row.reminderReason ?? "—"}</td>
                    <td className="max-w-[220px] px-3 py-2 align-top text-[11px] text-slate-500">{row.rationale}</td>
                    <td className="px-3 py-2 align-top">
                      <FollowUpLeadRowActions leadId={row.leadId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {assistOn && assistReadyCount > 0 ? (
        <p className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-100/90">
          <span className="mr-2" aria-hidden>
            ✉️
          </span>
          Messaging Assist Ready — {assistReadyCount} draft{assistReadyCount === 1 ? "" : "s"} (review and copy only; nothing is
          sent automatically).
        </p>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold text-slate-200">Hot leads (AI priority high)</h2>
        <p className="mt-1 text-xs text-slate-500">Top 5 CRM leads with aiPriority = high (when autopilot layer has run).</p>
        {hot.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No high-priority leads yet — enable scoring flags and run autopilot execution.</p>
        ) : (
          <ul className="mt-3 space-y-2 rounded-lg border border-amber-500/20 bg-amber-950/10 p-3 text-sm">
            {hot.map((r) => {
              const d = draftMap.get(r.id);
              const chips = tagChips(r.aiTags);
              const { emphasize, label } = messagingAssistEmphasis(r.aiPriority, chips);
              return (
                <li key={r.id} className="flex flex-col gap-2 border-b border-amber-500/10 pb-2 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-200">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs text-slate-400">
                      score {r.aiScore != null ? Math.round(r.aiScore) : "—"} · {r.email}
                    </span>
                  </div>
                  {assistOn && d ? (
                    <LeadMessagingAssistCell
                      draft={d}
                      emphasize={emphasize}
                      emphasisLabel={label}
                      priority={r.aiPriority}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-200">Lead intelligence (CRM)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Autopilot ai* fields only — sorted by score descending. Max 200 recent leads loaded.
          {assistOn ? " Suggested replies are drafts for operator review only." : ""}
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full min-w-[720px] text-left text-sm text-slate-200">
            <thead className="border-b border-slate-700 bg-slate-900/80 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Tags</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                {assistOn ? <th className="min-w-[240px] px-3 py-2">Suggested reply</th> : null}
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={assistOn ? 7 : 6} className="px-3 py-6 text-center text-slate-500">
                    No leads in CRM.
                  </td>
                </tr>
              ) : (
                sorted.map((r) => {
                  const chips = tagChips(r.aiTags);
                  const d = draftMap.get(r.id);
                  const { emphasize, label } = messagingAssistEmphasis(r.aiPriority, chips);
                  return (
                    <tr key={r.id} className="border-b border-slate-800">
                      <td className="px-3 py-2 font-mono text-xs">
                        {r.aiScore != null ? Math.round(r.aiScore) : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {r.aiPriority ? (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityBadgeClass(r.aiPriority)}`}
                          >
                            {r.aiPriority}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="max-w-[220px] px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {chips.length === 0 ? (
                            <span className="text-slate-500">—</span>
                          ) : (
                            chips.map((t) => (
                              <span
                                key={t}
                                className="rounded border border-slate-600 bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-300"
                              >
                                {t}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-400">{r.email}</td>
                      {assistOn ? (
                        <td className="max-w-[320px] px-3 py-2 align-top text-xs">
                          {d ? (
                            <LeadMessagingAssistCell
                              draft={d}
                              emphasize={emphasize}
                              emphasisLabel={label}
                              priority={r.aiPriority}
                            />
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
