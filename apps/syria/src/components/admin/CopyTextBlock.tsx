"use client";

import { useState } from "react";

type Props = {
  text: string;
  copyLabel: string;
  copiedLabel: string;
  dir?: "rtl" | "ltr";
};

export function CopyTextBlock({ text, copyLabel, copiedLabel, dir = "rtl" }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <pre
        className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-800"
        dir={dir}
      >
        {text}
      </pre>
      <button
        type="button"
        className="mt-2 text-sm font-semibold text-amber-800 underline decoration-amber-800/50 hover:decoration-amber-900"
        onClick={() => {
          void navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
