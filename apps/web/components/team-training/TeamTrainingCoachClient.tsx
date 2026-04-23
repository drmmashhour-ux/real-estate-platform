"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { TRAINING_SCENARIOS } from "@/modules/training-scenarios/training-scenarios.data";
import {
  addCoachFeedback,
  addTeamMember,
  badgeLabel,
  buildLeaderboard,
  buildTeamPerformanceSummary,
  completeSessionResults,
  createTeam,
  createTrainingSession,
  ensureChallenges,
  getChallengeProgress,
  getGamification,
  listActiveChallenges,
  listFeedbackForTeam,
  listNotifications,
  listSessionsForTeam,
  listTeams,
  listTeamMembers,
  markNotificationRead,
  type TeamSessionResult,
  type TeamTrainingMode,
} from "@/modules/team-training";

const COACH_ID = "lecipm-coach-local";

export function TeamTrainingCoachClient({
  dashBase,
  adminBase,
}: {
  dashBase: string;
  adminBase: string;
}) {
  const [tick, setTick] = useState(0);
  const teams = useMemo(() => listTeams(), [tick]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [newTeamName, setNewTeamName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");

  const [sessionMode, setSessionMode] = useState<TeamTrainingMode>("group");
  const [scenarioId, setScenarioId] = useState<string>("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [resultDrafts, setResultDrafts] = useState<
    Record<string, { avgScore: string; closingRate: string; controlScore: string; improvementDelta: string; won: boolean }>
  >({});

  const [feedbackSessionId, setFeedbackSessionId] = useState("");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackMistakes, setFeedbackMistakes] = useState("");

  useEffect(() => {
    if (!selectedTeamId && teams[0]) setSelectedTeamId(teams[0].teamId);
  }, [teams, selectedTeamId]);

  const members = useMemo(() => (selectedTeamId ? listTeamMembers(selectedTeamId) : []), [selectedTeamId, tick]);
  const leaderboard = useMemo(
    () => (selectedTeamId ? buildLeaderboard(selectedTeamId) : []),
    [selectedTeamId, tick],
  );
  const sessions = useMemo(
    () => (selectedTeamId ? listSessionsForTeam(selectedTeamId) : []),
    [selectedTeamId, tick],
  );
  const perf = useMemo(
    () => (selectedTeamId ? buildTeamPerformanceSummary(selectedTeamId) : null),
    [selectedTeamId, tick],
  );
  const notifications = useMemo(() => listNotifications(selectedTeamId || undefined), [selectedTeamId, tick]);
  const coachFeedback = useMemo(
    () => (selectedTeamId ? listFeedbackForTeam(selectedTeamId) : []),
    [selectedTeamId, tick],
  );

  useEffect(() => {
    if (selectedTeamId) ensureChallenges(selectedTeamId);
  }, [selectedTeamId]);

  const challenges = useMemo(() => listActiveChallenges(), [tick, selectedTeamId]);

  const refresh = useCallback(() => setTick((x) => x + 1), []);

  function handleCreateTeam() {
    if (!newTeamName.trim()) return;
    const t = createTeam({ name: newTeamName, coachId: COACH_ID, coachDisplayName: "Coach" });
    setSelectedTeamId(t.teamId);
    setNewTeamName("");
    refresh();
  }

  function handleAddMember() {
    if (!selectedTeamId || !memberName.trim()) return;
    addTeamMember(selectedTeamId, { displayName: memberName, email: memberEmail || undefined });
    setMemberName("");
    setMemberEmail("");
    refresh();
  }

  function toggleParticipant(id: string) {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function ensureDraft(memberId: string) {
    setResultDrafts((d) => ({
      ...d,
      [memberId]: d[memberId] ?? {
        avgScore: "72",
        closingRate: "0.4",
        controlScore: "68",
        improvementDelta: "0",
        won: false,
      },
    }));
  }

  function logSession() {
    if (!selectedTeamId || participantIds.length === 0) return;
    const sess = createTrainingSession({
      teamId: selectedTeamId,
      scenarioId: scenarioId || undefined,
      mode: sessionMode,
      participantMemberIds: participantIds,
    });
    const results: TeamSessionResult[] = participantIds.map((memberId) => {
      const r = resultDrafts[memberId] ?? {
        avgScore: "70",
        closingRate: "0.35",
        controlScore: "65",
        improvementDelta: "0",
        won: false,
      };
      return {
        memberId,
        avgScore: Number(r.avgScore) || 0,
        closingRate: Math.min(1, Math.max(0, Number(r.closingRate) || 0)),
        controlScore: Number(r.controlScore) || 0,
        improvementDelta: Number(r.improvementDelta) || 0,
        scenarioId: scenarioId || undefined,
        won: r.won,
      };
    });
    completeSessionResults(sess.sessionId, results);
    setParticipantIds([]);
    setResultDrafts({});
    refresh();
  }

  function submitFeedback() {
    if (!selectedTeamId || !feedbackSessionId.trim() || !feedbackComment.trim()) return;
    addCoachFeedback({
      sessionId: feedbackSessionId.trim(),
      coachId: COACH_ID,
      teamId: selectedTeamId,
      comment: feedbackComment,
      mistakes: feedbackMistakes.split(",").map((x) => x.trim()).filter(Boolean),
    });
    setFeedbackComment("");
    setFeedbackMistakes("");
    refresh();
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 p-6 text-white">
      <header className="rounded-2xl border border-white/10 bg-zinc-950/70 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400/90">LECIPM · Team training</p>
        <h1 className="mt-2 text-2xl font-semibold">Coach dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Browser-local team hub for practice logging, leaderboards, challenges, and feedback — upgrade to org API when you
          connect identities.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <Link href={`${dashBase}/admin/training-live`} className="text-emerald-400 underline">
            Training live
          </Link>
          <Link href={`${adminBase}`} className="text-zinc-400 underline">
            Admin home
          </Link>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-sm font-semibold text-white">Teams</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
              placeholder="New team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
            />
            <button
              type="button"
              className="rounded-lg bg-violet-700 px-4 py-2 text-xs font-semibold hover:bg-violet-600"
              onClick={() => handleCreateTeam()}
            >
              Create team
            </button>
          </div>
          <label className="mt-4 block text-xs text-zinc-400">
            Active team
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              <option value="">—</option>
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-sm font-semibold text-white">Add member</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
              placeholder="Display name"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            />
            <input
              className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
              placeholder="Email (optional)"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={!selectedTeamId}
            className="mt-4 rounded-lg border border-white/15 px-4 py-2 text-xs text-zinc-200 hover:bg-white/5 disabled:opacity-40"
            onClick={() => handleAddMember()}
          >
            Add to team
          </button>
        </div>
      </section>

      {perf && selectedTeamId ? (
        <section className="rounded-2xl border border-emerald-900/35 bg-emerald-950/15 p-6">
          <h2 className="text-sm font-semibold text-emerald-200">Performance analytics</h2>
          <p className="mt-2 text-sm text-zinc-400">{perf.trendLabel}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-black/40 px-4 py-3 text-sm">
              <p className="text-zinc-500">Sessions logged</p>
              <p className="font-mono text-2xl text-white">{perf.totalSessions}</p>
            </div>
            <div className="rounded-xl bg-black/40 px-4 py-3 text-sm">
              <p className="text-zinc-500">Team avg score</p>
              <p className="font-mono text-2xl text-white">{perf.avgTeamScore || "—"}</p>
            </div>
            <div className="rounded-xl bg-black/40 px-4 py-3 text-sm">
              <p className="text-zinc-500">Weak areas (heuristic)</p>
              <p className="text-zinc-300">{perf.weakestSkills.join(", ")}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Best performers:{" "}
            {perf.bestPerformers.map((p) => `${p.displayName} (${p.avgScore})`).join(" · ") || "—"}
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-6">
        <h2 className="text-sm font-semibold text-white">Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Add members and log sessions to populate ranks.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase text-zinc-500">
                <tr>
                  <th className="pb-2">#</th>
                  <th className="pb-2">Rep</th>
                  <th className="pb-2">Avg score</th>
                  <th className="pb-2">Close rate</th>
                  <th className="pb-2">Control</th>
                  <th className="pb-2">Improve</th>
                  <th className="pb-2">Sessions</th>
                </tr>
              </thead>
              <tbody className="text-zinc-200">
                {leaderboard.map((r) => (
                  <tr key={r.memberId} className="border-t border-white/5">
                    <td className="py-2 font-mono text-violet-300">{r.rank}</td>
                    <td className="py-2">{r.displayName}</td>
                    <td className="py-2">{r.avgScore}</td>
                    <td className="py-2">{(r.closingRate * 100).toFixed(0)}%</td>
                    <td className="py-2">{r.controlScore}</td>
                    <td className="py-2">{r.improvementRate}</td>
                    <td className="py-2">{r.sessionsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-amber-900/35 bg-amber-950/15 p-6">
        <h2 className="text-sm font-semibold text-amber-200">Log training session</h2>
        <p className="mt-2 text-xs text-zinc-500">
          After reps finish Training Live or scenario lab, record scores for competitive compare.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block text-xs text-zinc-400">
            Mode
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
              value={sessionMode}
              onChange={(e) => setSessionMode(e.target.value as TeamTrainingMode)}
            >
              <option value="solo">Solo</option>
              <option value="group">Group</option>
              <option value="competitive">Competitive</option>
            </select>
          </label>
          <label className="block text-xs text-zinc-400">
            Scenario (optional)
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
            >
              <option value="">—</option>
              {TRAINING_SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.difficulty}] {s.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-4 text-[11px] uppercase text-zinc-500">Participants</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.memberId}
              type="button"
              onClick={() => {
                toggleParticipant(m.memberId);
                ensureDraft(m.memberId);
              }}
              className={`rounded-full px-3 py-1 text-xs ${
                participantIds.includes(m.memberId) ? "bg-violet-700 text-white" : "border border-white/15 text-zinc-400"
              }`}
            >
              {m.displayName}
            </button>
          ))}
        </div>
        {participantIds.map((id) => {
          const m = members.find((x) => x.memberId === id);
          const r = resultDrafts[id] ?? {
            avgScore: "72",
            closingRate: "0.4",
            controlScore: "68",
            improvementDelta: "0",
            won: false,
          };
          return (
            <div key={id} className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-black/40 p-4 sm:grid-cols-5">
              <p className="text-sm font-medium text-white sm:col-span-5">{m?.displayName}</p>
              <input
                className="rounded border border-white/10 bg-black/50 px-2 py-1 text-xs"
                placeholder="Avg score"
                value={r.avgScore}
                onChange={(e) =>
                  setResultDrafts((d) => ({
                    ...d,
                    [id]: { ...r, avgScore: e.target.value },
                  }))
                }
              />
              <input
                className="rounded border border-white/10 bg-black/50 px-2 py-1 text-xs"
                placeholder="Close rate 0–1"
                value={r.closingRate}
                onChange={(e) =>
                  setResultDrafts((d) => ({
                    ...d,
                    [id]: { ...r, closingRate: e.target.value },
                  }))
                }
              />
              <input
                className="rounded border border-white/10 bg-black/50 px-2 py-1 text-xs"
                placeholder="Control"
                value={r.controlScore}
                onChange={(e) =>
                  setResultDrafts((d) => ({
                    ...d,
                    [id]: { ...r, controlScore: e.target.value },
                  }))
                }
              />
              <input
                className="rounded border border-white/10 bg-black/50 px-2 py-1 text-xs"
                placeholder="Δ improve"
                value={r.improvementDelta}
                onChange={(e) =>
                  setResultDrafts((d) => ({
                    ...d,
                    [id]: { ...r, improvementDelta: e.target.value },
                  }))
                }
              />
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={r.won}
                  onChange={(e) =>
                    setResultDrafts((d) => ({
                      ...d,
                      [id]: { ...r, won: e.target.checked },
                    }))
                  }
                />
                Won
              </label>
            </div>
          );
        })}
        <button
          type="button"
          disabled={!selectedTeamId || participantIds.length === 0}
          className="mt-6 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-500 disabled:opacity-40"
          onClick={() => logSession()}
        >
          Save session results
        </button>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-sm font-semibold text-white">Challenges</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            {challenges.slice(0, 6).map((c) => (
              <li key={c.challengeId} className="rounded-lg border border-white/10 bg-black/50 px-4 py-3">
                <p className="font-medium text-white">{c.title}</p>
                <p className="text-xs text-zinc-500">{c.description}</p>
                <p className="mt-2 text-[11px] text-zinc-600">
                  {c.cadence} · target {c.targetCount}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-sm font-semibold text-white">Notifications</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {notifications.slice(0, 12).map((n) => (
              <li
                key={n.id}
                className={`flex justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 ${n.read ? "opacity-60" : ""}`}
              >
                <span>
                  <span className="text-zinc-500">{n.kind}</span> — {n.title}
                </span>
                {!n.read ? (
                  <button type="button" className="text-xs text-violet-400" onClick={() => markNotificationRead(n.id)}>
                    Read
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-violet-900/35 bg-violet-950/20 p-6">
        <h2 className="text-sm font-semibold text-violet-200">Coach feedback</h2>
        <label className="mt-4 block text-xs text-zinc-400">
          Session ID
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
            value={feedbackSessionId}
            onChange={(e) => setFeedbackSessionId(e.target.value)}
          >
            <option value="">— pick session —</option>
            {sessions.map((s) => (
              <option key={s.sessionId} value={s.sessionId}>
                {s.sessionId.slice(0, 8)}… · {s.mode} · {s.startedAtIso.slice(0, 10)}
              </option>
            ))}
          </select>
        </label>
        <textarea
          className="mt-3 min-h-[80px] w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm"
          placeholder="Comment — strengths, next focus…"
          value={feedbackComment}
          onChange={(e) => setFeedbackComment(e.target.value)}
        />
        <input
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm"
          placeholder="Mistakes (comma-separated tags)"
          value={feedbackMistakes}
          onChange={(e) => setFeedbackMistakes(e.target.value)}
        />
        <button
          type="button"
          disabled={!selectedTeamId || !feedbackSessionId}
          className="mt-4 rounded-lg bg-violet-700 px-4 py-2 text-xs font-semibold disabled:opacity-40"
          onClick={() => submitFeedback()}
        >
          Post feedback
        </button>
        <ul className="mt-6 space-y-2 text-xs text-zinc-400">
          {coachFeedback.slice(-5).map((f) => (
            <li key={f.feedbackId}>
              {f.createdAtIso.slice(0, 10)} — {f.comment.slice(0, 120)}
              {f.comment.length > 120 ? "…" : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
        <h2 className="text-sm font-semibold text-white">Recent sessions</h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
          {sessions.slice(0, 8).map((s) => (
            <li key={s.sessionId}>
              <span className="font-mono text-zinc-500">{s.sessionId.slice(0, 8)}</span> · {s.mode} ·{" "}
              {s.results?.length ?? 0} results
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
        <h2 className="text-sm font-semibold text-white">Gamification preview</h2>
        <p className="mt-2 text-xs text-zinc-500">XP, levels, streaks — pick a member.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {members.map((m) => {
            const g = getGamification(m.memberId);
            return (
              <div key={m.memberId} className="rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-xs">
                <p className="font-medium text-white">{m.displayName}</p>
                <p className="mt-1 text-zinc-500">
                  Lvl {g.level} · {g.xp} XP · streak {g.streakDays}d
                </p>
                <p className="mt-2 text-zinc-400">{g.badges.map((b) => badgeLabel(b)).join(" · ") || "—"}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
