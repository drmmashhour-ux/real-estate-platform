"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ClipboardList, GraduationCap, LineChart, UserPlus, Users } from "lucide-react";
import { DEMO_TRAINING_STEPS } from "@/components/demo/demo-training-data";
import { FieldSpecialistContractTemplate } from "@/components/team/FieldSpecialistContractTemplate";
import { FieldTeamRulesPanel } from "@/components/team/FieldTeamRulesPanel";
import { InterviewPanel } from "@/components/team/InterviewPanel";
import {
  BONUS_PER_ACTIVATION_CAD,
  BONUS_PER_DEMO_CAD,
  FIELD_TEAM_DAILY_TARGETS,
  type InterviewRubric,
} from "@/components/team/team-constants";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type CandidateRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  notes: string | null;
  interviewScores: unknown;
  linkedUserId: string | null;
  linkedUser: { id: string; email: string; name: string | null } | null;
};

type PerfRow = {
  id: string;
  userId: string;
  demosCompleted: number;
  brokersActivated: number;
  callsMade: number;
  updatedAt: string;
  user: { id: string; email: string; name: string | null };
};

const STATUS_OPTIONS = ["applied", "interview", "accepted", "rejected"] as const;

function sectionLink(href: string, label: string, icon: ReactNode) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85 hover:border-premium-gold/40 hover:text-white"
    >
      {icon}
      {label}
    </a>
  );
}

function formatAgent(u: { name: string | null; email: string }) {
  return u.name?.trim() || u.email;
}

export default function FieldTeamDashboardClient() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [performance, setPerformance] = useState<PerfRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [noteDraft, setNoteDraft] = useState("");
  const [linkedUserDraft, setLinkedUserDraft] = useState("");

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch("/api/admin/team/candidates"),
        fetch("/api/admin/team/performance"),
      ]);
      if (!cRes.ok) throw new Error(await cRes.text());
      if (!pRes.ok) throw new Error(await pRes.text());
      const cJson = (await cRes.json()) as CandidateRow[];
      const pJson = (await pRes.json()) as PerfRow[];
      setCandidates(cJson);
      setPerformance(pJson);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(() => candidates.find((c) => c.id === selectedId) ?? null, [candidates, selectedId]);

  useEffect(() => {
    if (selected) {
      setNoteDraft(selected.notes ?? "");
      setLinkedUserDraft(selected.linkedUserId ?? "");
    } else {
      setNoteDraft("");
      setLinkedUserDraft("");
    }
  }, [selected]);

  const perfByUser = useMemo(() => new Map(performance.map((p) => [p.userId, p])), [performance]);

  const activeMembers = useMemo(() => {
    return candidates
      .filter((c) => c.status === "accepted" && c.linkedUserId && c.linkedUser)
      .map((c) => ({
        candidate: c,
        user: c.linkedUser!,
        perf: c.linkedUserId ? perfByUser.get(c.linkedUserId) : undefined,
      }));
  }, [candidates, perfByUser]);

  const addCandidate = async () => {
    const name = newName.trim();
    const email = newEmail.trim();
    if (!name || !email) return;
    const res = await fetch("/api/admin/team/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone: newPhone.trim() || null }),
    });
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    await load();
  };

  const patchCandidate = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/team/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    await load();
  };

  const saveNotesAndLink = async () => {
    if (!selected) return;
    await patchCandidate(selected.id, {
      notes: noteDraft,
      linkedUserId: linkedUserDraft.trim() || null,
    });
  };

  const saveRubric = async (candidateId: string, rubric: InterviewRubric) => {
    await patchCandidate(candidateId, { interviewScores: rubric });
  };

  const initPerf = async (userId: string) => {
    const res = await fetch("/api/admin/team/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) setErr(await res.text());
    else await load();
  };

  const savePerf = async (userId: string, demos: number, brokers: number, calls: number) => {
    const res = await fetch(`/api/admin/team/performance/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demosCompleted: demos, brokersActivated: brokers, callsMade: calls }),
    });
    if (!res.ok) setErr(await res.text());
    else await load();
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] pb-16 pt-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-premium-gold/90">Admin</p>
          <h1 className="font-serif text-3xl text-white sm:text-4xl">Field Demo Team</h1>
          <p className="max-w-2xl text-sm text-white/65">
            Hire, interview, train, and track Field Demo Specialists. Specialists use the{" "}
            <Link href="/field" className="text-premium-gold underline-offset-2 hover:underline">
              field dashboard
            </Link>{" "}
            for daily execution.
          </p>
          <nav className="flex flex-wrap gap-2 pt-2">
            {sectionLink("#candidates", "Candidates", <UserPlus className="h-4 w-4 text-premium-gold" />)}
            {sectionLink("#interview", "Interview", <ClipboardList className="h-4 w-4 text-premium-gold" />)}
            <Link
              href="/admin/team/training"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85 hover:border-premium-gold/40 hover:text-white"
            >
              <GraduationCap className="h-4 w-4 text-premium-gold" />
              Training
            </Link>
            {sectionLink("#active", "Active team", <Users className="h-4 w-4 text-premium-gold" />)}
            {sectionLink("#performance", "Performance", <LineChart className="h-4 w-4 text-premium-gold" />)}
          </nav>
        </header>

        {err ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{err}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <FieldTeamRulesPanel />
            <Card variant="default" className="border-white/10 bg-[#121212]">
              <CardHeader>
                <CardTitle className="text-lg text-white">Daily tasks (field agents)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/80">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Contact {FIELD_TEAM_DAILY_TARGETS.brokerContacts} brokers</li>
                  <li>Run {FIELD_TEAM_DAILY_TARGETS.demos} demos</li>
                  <li>Complete {FIELD_TEAM_DAILY_TARGETS.followUps} follow-ups</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <Card variant="default" className="border-white/10 bg-[#121212]">
            <CardHeader>
              <CardTitle className="text-lg text-white">Compensation (reference)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-white/75">
              <p>
                Bonus per demo:{" "}
                <span className="font-medium text-premium-gold">${BONUS_PER_DEMO_CAD} CAD</span>
              </p>
              <p>
                Bonus per activation:{" "}
                <span className="font-medium text-premium-gold">${BONUS_PER_ACTIVATION_CAD} CAD</span>
              </p>
              <p className="text-xs text-white/45">Payout rules are confirmed separately by finance; this panel is for planning.</p>
            </CardContent>
          </Card>
        </div>

        <details className="group rounded-xl border border-white/10 bg-[#121212] p-4">
          <summary className="cursor-pointer list-none text-sm font-medium text-white marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="text-premium-gold group-open:text-premium-gold">▸ </span>
            Contract template — Field Demo Specialist Agreement
          </summary>
          <div className="mt-4">
            <FieldSpecialistContractTemplate />
          </div>
        </details>

        <section id="candidates" className="scroll-mt-24 space-y-4">
          <h2 className="text-xl font-semibold text-white">Candidates</h2>
          <Card variant="default" className="border-white/10 bg-[#121212]">
            <CardHeader>
              <CardTitle className="text-base text-white">Add candidate</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-black/30" />
              <Input placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="bg-black/30" />
              <Input placeholder="Phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="bg-black/30" />
              <Button variant="goldPrimary" onClick={addCandidate}>
                Add
              </Button>
            </CardContent>
          </Card>

          {loading ? (
            <p className="text-sm text-white/50">Loading…</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-white/10 bg-black/30 text-xs uppercase text-white/50">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-b border-white/5 hover:bg-white/[0.04] ${selectedId === c.id ? "bg-premium-gold/10" : ""}`}
                    >
                      <td className="px-3 py-2 text-white/90">{c.name}</td>
                      <td className="px-3 py-2 text-white/70">{c.email}</td>
                      <td className="px-3 py-2 text-white/60">{c.phone ?? "—"}</td>
                      <td className="px-3 py-2">
                        <select
                          value={c.status}
                          onChange={(e) => void patchCandidate(c.id, { status: e.target.value })}
                          className="rounded-md border border-white/20 bg-black/40 px-2 py-1 text-xs text-white"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedId(c.id)}>
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="interview" className="scroll-mt-24 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Interview &amp; notes</h2>
            {selected ? (
              <Card variant="default" className="border-white/10 bg-[#121212]">
                <CardHeader>
                  <CardTitle className="text-base text-white">{selected.name}</CardTitle>
                  <p className="text-xs text-white/50">{selected.email}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="block text-xs text-white/50">Notes</label>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                  />
                  <label className="block text-xs text-white/50">Linked platform user ID (on accept)</label>
                  <Input
                    value={linkedUserDraft}
                    onChange={(e) => setLinkedUserDraft(e.target.value)}
                    placeholder="User UUID"
                    className="bg-black/30 font-mono text-xs"
                  />
                  <Button variant="secondary" onClick={saveNotesAndLink}>
                    Save notes &amp; link
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-white/50">Select a candidate from the table.</p>
            )}
          </div>
          <InterviewPanel
            candidateId={selectedId}
            interviewScoresJson={selected?.interviewScores}
            onSaveRubric={saveRubric}
          />
        </section>

        <section id="active" className="scroll-mt-24 space-y-4">
          <h2 className="text-xl font-semibold text-white">Active team</h2>
          <p className="text-sm text-white/55">Accepted candidates with a linked user. Initialize metrics if the row is missing.</p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/10 bg-black/30 text-xs uppercase text-white/50">
                <tr>
                  <th className="px-3 py-2">Agent</th>
                  <th className="px-3 py-2">Demos</th>
                  <th className="px-3 py-2">Conversion</th>
                  <th className="px-3 py-2">Activity</th>
                  <th className="px-3 py-2">Est. bonus</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {activeMembers.map(({ candidate, user, perf }) => {
                  const demos = perf?.demosCompleted ?? 0;
                  const act = perf?.brokersActivated ?? 0;
                  const calls = perf?.callsMade ?? 0;
                  const conv = demos > 0 ? Math.round((100 * act) / demos) : 0;
                  const bonus = demos * BONUS_PER_DEMO_CAD + act * BONUS_PER_ACTIVATION_CAD;
                  return (
                    <tr key={candidate.id} className="border-b border-white/5">
                      <td className="px-3 py-2">
                        <div className="font-medium text-white/90">{formatAgent(user)}</div>
                        <div className="text-xs text-white/45">{user.email}</div>
                      </td>
                      <td className="px-3 py-2 text-white/80">{demos}</td>
                      <td className="px-3 py-2 text-white/80">{conv}%</td>
                      <td className="px-3 py-2 text-white/70">
                        {calls} calls
                        {perf?.updatedAt ? (
                          <div className="text-[10px] text-white/40">Updated {new Date(perf.updatedAt).toLocaleString()}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-premium-gold/90">${bonus}</td>
                      <td className="px-3 py-2">
                        {!perf ? (
                          <Button size="sm" variant="outline" onClick={() => void initPerf(user.id)}>
                            Init metrics
                          </Button>
                        ) : (
                          <Badge variant="default" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                            tracked
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {activeMembers.length === 0 ? <p className="px-2 py-6 text-sm text-white/45">No accepted + linked specialists yet.</p> : null}
          </div>
        </section>

        <section id="performance" className="scroll-mt-24 space-y-4">
          <h2 className="text-xl font-semibold text-white">Performance tracking</h2>
          <p className="text-sm text-white/55">Per agent: calls, demos, brokers converted. Edit operational counters (e.g. from field reports).</p>
          <div className="space-y-4">
            {performance.map((p) => (
              <PerfEditor key={p.id} row={p} onSave={savePerf} />
            ))}
            {performance.length === 0 && !loading ? (
              <p className="text-sm text-white/45">No performance rows yet — accept a candidate with a linked user or use Init metrics.</p>
            ) : null}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Training content preview</h2>
          <Card variant="default" className="border-white/10 bg-[#121212]">
            <CardContent className="pt-6 text-sm text-white/75">
              <p className="mb-3">
                Full curriculum:{" "}
                <Link href="/admin/team/training" className="text-premium-gold underline-offset-2 hover:underline">
                  /admin/team/training
                </Link>
              </p>
              <p className="mb-2 text-xs uppercase tracking-wide text-white/45">Demo script (first steps)</p>
              <ol className="list-decimal space-y-2 pl-5">
                {DEMO_TRAINING_STEPS.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <span className="text-white/90">{s.title}</span>
                    <span className="text-white/50"> — {s.action ?? s.script.slice(0, 80)}…</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/marketing/demo-training">
                  <Button variant="outline" size="sm">
                    Demo training (marketing)
                  </Button>
                </Link>
                <Link href="/marketing/objections">
                  <Button variant="outline" size="sm">
                    Objections
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function PerfEditor({ row, onSave }: { row: PerfRow; onSave: (userId: string, d: number, b: number, c: number) => Promise<void> }) {
  const [demos, setDemos] = useState(row.demosCompleted);
  const [brokers, setBrokers] = useState(row.brokersActivated);
  const [calls, setCalls] = useState(row.callsMade);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDemos(row.demosCompleted);
    setBrokers(row.brokersActivated);
    setCalls(row.callsMade);
  }, [row.demosCompleted, row.brokersActivated, row.callsMade, row.userId]);

  const submit = async () => {
    setBusy(true);
    try {
      await onSave(row.userId, demos, brokers, calls);
    } finally {
      setBusy(false);
    }
  };

  const conv = demos > 0 ? Math.round((100 * brokers) / demos) : 0;

  return (
    <Card variant="default" className="border-white/10 bg-[#121212]">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base text-white">{formatAgent(row.user)}</CardTitle>
          <p className="text-xs text-white/45">{row.user.email}</p>
        </div>
        <div className="text-xs text-white/50">
          Conversion: <span className="text-premium-gold">{conv}%</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label className="text-[10px] uppercase text-white/45">Calls</label>
          <Input
            type="number"
            min={0}
            value={calls}
            onChange={(e) => setCalls(Number(e.target.value))}
            className="mt-1 w-28 bg-black/30"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-white/45">Demos</label>
          <Input
            type="number"
            min={0}
            value={demos}
            onChange={(e) => setDemos(Number(e.target.value))}
            className="mt-1 w-28 bg-black/30"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-white/45">Activations</label>
          <Input
            type="number"
            min={0}
            value={brokers}
            onChange={(e) => setBrokers(Number(e.target.value))}
            className="mt-1 w-28 bg-black/30"
          />
        </div>
        <Button variant="goldPrimary" size="sm" onClick={submit} disabled={busy}>
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
