"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  EMPTY_RUBRIC,
  INTERVIEW_QUESTIONS,
  type InterviewRubric,
  parseInterviewScores,
} from "@/components/team/team-constants";

type Props = {
  candidateId: string | null;
  interviewScoresJson: unknown;
  onSaveRubric: (candidateId: string, rubric: InterviewRubric) => Promise<void>;
  disabled?: boolean;
};

function RubricSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-white/70">
        <span>{label}</span>
        <span className="text-premium-gold">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-400"
      />
    </div>
  );
}

export function InterviewPanel({ candidateId, interviewScoresJson, onSaveRubric, disabled }: Props) {
  const [rubric, setRubric] = useState<InterviewRubric>(EMPTY_RUBRIC);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const parsed = parseInterviewScores(interviewScoresJson);
    setRubric(parsed ?? EMPTY_RUBRIC);
  }, [candidateId, interviewScoresJson]);

  if (!candidateId) {
    return (
      <Card variant="default" className="border-white/10 bg-[#121212]">
        <CardHeader>
          <CardTitle className="text-lg text-white">Interview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-white/60">Select a candidate to score the interview rubric.</CardContent>
      </Card>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await onSaveRubric(candidateId, rubric);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="default" className="border-white/10 bg-[#121212]">
      <CardHeader>
        <CardTitle className="text-lg text-white">Interview</CardTitle>
        <p className="text-sm text-white/55">
          Ask the questions live, then score 1–5 on each dimension. Save attaches rubric to the candidate record.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-white/45">Interview questions</h4>
          <ul className="space-y-3 text-sm text-white/85">
            {INTERVIEW_QUESTIONS.map((q, i) => (
              <li key={q.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <span className="text-premium-gold/90">Q{i + 1}: </span>
                <span className="text-white/90">&ldquo;{q.text}&rdquo;</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-4">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-amber-200/90">Scoring</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <RubricSlider label="Clarity" value={rubric.clarity} onChange={(v) => setRubric((r) => ({ ...r, clarity: v }))} />
            <RubricSlider
              label="Confidence"
              value={rubric.confidence}
              onChange={(v) => setRubric((r) => ({ ...r, confidence: v }))}
            />
            <RubricSlider label="Listening" value={rubric.listening} onChange={(v) => setRubric((r) => ({ ...r, listening: v }))} />
            <RubricSlider
              label="Discipline"
              value={rubric.discipline}
              onChange={(v) => setRubric((r) => ({ ...r, discipline: v }))}
            />
          </div>
          <Button className="mt-4" onClick={save} disabled={disabled || saving}>
            {saving ? "Saving…" : "Save scores to candidate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
