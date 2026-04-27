"use client";

import { useEffect, useState, useTransition } from "react";

import { launchPlan, type LaunchPlanDay } from "@/lib/launch/plan";
import { toggleLaunchTaskAction } from "@/lib/launch/progressServerActions";
import { cn } from "@/lib/utils";

type Props = {
  localeCountryBase: string;
  initialDay: number;
  initialTaskStates: boolean[];
};

/**
 * Per-day task checkboxes. Parent should remount with a new `key` when the selected `day` changes
 * (e.g. `key={\`ld-${day}\`}`) so state stays aligned with the server.
 */
export function LaunchChecklistClient({ localeCountryBase, initialDay, initialTaskStates }: Props) {
  const [pending, startTransition] = useTransition();
  const [states, setStates] = useState(() => initialTaskStates);

  useEffect(() => {
    setStates(initialTaskStates);
  }, [initialDay, initialTaskStates]);

  const plan: LaunchPlanDay | undefined = launchPlan[initialDay - 1];
  if (!plan) {
    return <p className="text-sm text-zinc-500">Invalid day.</p>;
  }

  const onToggle = (taskIndex: number, nextChecked: boolean) => {
    const prev = states;
    const newStates = plan.tasks.map((_, i) => (i === taskIndex ? nextChecked : states[i] ?? false));
    setStates(newStates);
    startTransition(async () => {
      const res = await toggleLaunchTaskAction({
        day: initialDay,
        taskIndex,
        completed: nextChecked,
        localeCountryBase,
      });
      if (!res.ok) {
        setStates(prev);
      }
    });
  };

  return (
    <ul className="mt-4 space-y-3">
      {plan.tasks.map((text, i) => {
        const checked = states[i] ?? false;
        return (
          <li
            key={`${initialDay}-${i}`}
            className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3"
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-zinc-600 text-amber-500 focus:ring-amber-500/40"
              checked={checked}
              disabled={pending}
              onChange={(e) => onToggle(i, e.target.checked)}
              aria-label={`Task ${i + 1} for day ${initialDay}`}
            />
            <span className={cn("text-sm text-zinc-200", checked && "text-zinc-500 line-through")}>{text}</span>
          </li>
        );
      })}
    </ul>
  );
}
