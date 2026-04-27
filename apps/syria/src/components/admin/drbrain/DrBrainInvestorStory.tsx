"use client";

import { useState } from "react";

type Props = {
  labels: {
    title: string;
    runDemo: string;
    s1: string;
    s2: string;
    s3: string;
    s4: string;
    s5: string;
    s6: string;
    demoHint: string;
  };
};

export function DrBrainInvestorStory(props: Props) {
  const { labels } = props;
  const [step, setStep] = useState(0);

  const sections = [labels.s1, labels.s2, labels.s3, labels.s4, labels.s5, labels.s6];

  return (
    <section className="space-y-4 rounded-2xl border border-fuchsia-200 bg-fuchsia-50/60 p-4 text-sm text-fuchsia-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-semibold">{labels.title}</p>
        <button
          type="button"
          className="rounded-xl border border-fuchsia-400 bg-white px-3 py-1.5 text-xs font-semibold text-fuchsia-900 hover:bg-fuchsia-100"
          onClick={() => setStep((s) => (s + 1) % sections.length)}
        >
          {labels.runDemo}
        </button>
      </div>
      <p className="text-xs text-fuchsia-900">{labels.demoHint}</p>
      <ul className="space-y-3">
        {sections.map((text, i) => (
          <li
            key={i}
            className={`rounded-xl border px-3 py-2 transition ${
              step === i ? "border-fuchsia-500 bg-white shadow-sm" : "border-transparent opacity-75"
            }`}
          >
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
