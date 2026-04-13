"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { suggestQuebecMunicipalities } from "@/lib/geo/quebec-city-suggest";

export type QuebecLocationInputProps = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className: string;
  tone?: "light" | "dark";
  suggestionLimit?: number;
  autoComplete?: string;
  inputType?: "text" | "search";
};

/**
 * Location text field with Quebec municipality autocomplete (official MUN list).
 * Users can still type any string (neighbourhoods, partial addresses, listing codes).
 */
export function QuebecLocationInput({
  id,
  value,
  onChange,
  placeholder,
  className,
  tone = "dark",
  suggestionLimit = 12,
  autoComplete = "address-level2",
  inputType = "text",
}: QuebecLocationInputProps) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const suggestions = useMemo(
    () => suggestQuebecMunicipalities(value, suggestionLimit),
    [value, suggestionLimit]
  );

  const showList = open && value.trim().length >= 1 && suggestions.length > 0;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = useCallback(
    (name: string) => {
      onChange(name);
      setOpen(false);
    },
    [onChange]
  );

  useEffect(() => {
    setHighlight(0);
  }, [value, suggestions.length]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && suggestions[highlight]) {
      e.preventDefault();
      pick(suggestions[highlight]!);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const panelCls =
    tone === "light"
      ? "border border-slate-200 bg-white text-slate-900 shadow-lg"
      : "border border-white/15 bg-[#1a1a1a] text-white shadow-lg";

  const optBase =
    tone === "light"
      ? "w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
      : "w-full px-3 py-2 text-left text-sm hover:bg-white/10";
  const optHi =
    tone === "light" ? "bg-premium-gold/15 text-slate-900" : "bg-premium-gold/20 text-white";

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        type={inputType}
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-autocomplete="list"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={className}
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className={`absolute left-0 right-0 top-full z-[100] mt-1 max-h-56 overflow-auto rounded-xl py-1 ${panelCls}`}
        >
          {suggestions.map((name, i) => (
            <li key={name} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                className={[optBase, i === highlight ? optHi : ""].join(" ")}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(name)}
              >
                <span className="font-medium">{name}</span>
                <span className={tone === "light" ? "ml-1 text-xs text-slate-500" : "ml-1 text-xs text-white/50"}>
                  , QC
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
