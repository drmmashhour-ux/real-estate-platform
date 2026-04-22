"use client";

import type { ButtonHTMLAttributes } from "react";
import { useCallback, useState } from "react";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "role" | "aria-checked"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (next: boolean) => void;
  label?: string;
};

/** Accessible switch — gold track when on (design system). */
export function Toggle({ checked: controlled, defaultChecked, onCheckedChange, label, id, ...rest }: Props) {
  const [inner, setInner] = useState(Boolean(defaultChecked));
  const isControlled = controlled !== undefined;
  const on = isControlled ? controlled : inner;

  const toggle = useCallback(() => {
    const next = !on;
    if (!isControlled) setInner(next);
    onCheckedChange?.(next);
  }, [isControlled, on, onCheckedChange]);

  return (
    <div className="inline-flex items-center gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        className={[
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0B]",
          on ? "bg-[#D4AF37]/95" : "bg-white/10",
        ].join(" ")}
        {...rest}
      >
        <span
          className={[
            "pointer-events-none absolute left-1 top-1 block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
            on ? "translate-x-[22px]" : "translate-x-0",
          ].join(" ")}
          aria-hidden
        />
      </button>
      {label ?
        <label htmlFor={id} className="cursor-pointer text-sm text-zinc-200">
          {label}
        </label>
      : null}
    </div>
  );
}
