"use client";

import { posthog } from "@/components/analytics/PostHogClient";

type Props = {
  disabled?: boolean;
  onApply: () => void;
  label?: string;
};

export function ApplyDraftSuggestionButton({ disabled, onApply, label = "Apply suggestion to field (editable)" }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        posthog?.capture("auto_draft_applied", { source: "auto_drafting_panel" });
        onApply();
      }}
      className="rounded-md bg-[#C9A646] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-40"
    >
      {label}
    </button>
  );
}
