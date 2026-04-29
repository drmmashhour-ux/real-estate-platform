"use client";

import type { JsonValue } from "@/types/json-value";
import { BriefingSectionCard } from "./BriefingSectionCard";

type Section = {
  id: string;
  sectionKey: string;
  title: string;
  content: JsonValue;
  ordering: number;
};

export function ExecutiveBriefingViewer({ sections }: { sections: Section[] }) {
  const sorted = [...sections].sort((a, b) => a.ordering - b.ordering);
  return (
    <div className="space-y-4">
      {sorted.map((s) => (
        <BriefingSectionCard key={s.id} title={s.title} sectionKey={s.sectionKey} content={s.content} />
      ))}
    </div>
  );
}
