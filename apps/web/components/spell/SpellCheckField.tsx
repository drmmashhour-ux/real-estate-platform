"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type SpellCheckFieldHandle = {
  fix: () => Promise<void>;
  focus: () => void;
};

type SpellErr = { word: string; start: number; end: number; suggestions: string[] };

function escapeTitle(s: string): string {
  return s.replace(/\u0000/g, "").replace(/\s+/g, " ").trim().slice(0, 420);
}

function mirrorNodes(text: string, errors: SpellErr[], baseTextClass: string): React.ReactNode[] {
  if (!text) return [];
  const sorted = [...errors].sort((a, b) => a.start - b.start);
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  for (const e of sorted) {
    if (e.end <= i) continue;
    if (e.start > i) {
      nodes.push(
        <span key={`t${k++}`} className={baseTextClass}>
          {text.slice(i, e.start)}
        </span>
      );
    }
    const start = Math.max(e.start, i);
    const tip = e.suggestions.length
      ? escapeTitle(`Suggestions: ${e.suggestions.slice(0, 6).join(", ")}`)
      : "No suggestions";
    nodes.push(
      <span
        key={`e${e.start}-${e.word}`}
        className={`${baseTextClass} spell-check-miss underline decoration-[#f87171]/90 decoration-wavy [text-decoration-skip-ink:none] underline-offset-[3px]`}
        title={tip}
      >
        {text.slice(start, e.end)}
      </span>
    );
    i = e.end;
  }
  if (i < text.length) {
    nodes.push(
      <span key={`t${k++}`} className={baseTextClass}>
        {text.slice(i)}
      </span>
    );
  }
  return nodes;
}

export type SpellCheckFieldProps = {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  /** Classes for the field (border, padding, typography). Applied to input and underline layer. */
  className?: string;
  wrapperClassName?: string;
  localeHint?: "en" | "fr";
  showFixButton?: boolean;
  fixButtonClassName?: string;
  variant?: "gold" | "slate";
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
  "aria-invalid"?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};

const DEBOUNCE_MS = 400;

export const SpellCheckField = forwardRef<SpellCheckFieldHandle, SpellCheckFieldProps>(
  function SpellCheckField(
    {
      value,
      onChange,
      multiline = false,
      rows = 4,
      placeholder,
      className = "",
      wrapperClassName = "",
      localeHint,
      showFixButton = true,
      fixButtonClassName = "",
      variant = "gold",
      disabled,
      id: idProp,
      name,
      required,
      "aria-invalid": ariaInvalid,
      autoComplete,
      inputMode,
    },
    ref
  ) {
    const genId = useId();
    const id = idProp ?? genId;
    const innerRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
    const mirrorRef = useRef<HTMLDivElement | null>(null);
    const [errors, setErrors] = useState<SpellErr[]>([]);
    const [fixing, setFixing] = useState(false);

    const baseTextClass = variant === "slate" ? "text-slate-100" : "text-white";
    const caretClass = variant === "slate" ? "caret-emerald-400" : "caret-[#C9A646]";

    const runCheck = useCallback(
      async (text: string, signal: AbortSignal) => {
        if (!text.trim()) {
          setErrors([]);
          return;
        }
        const res = await fetch("/api/spell/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            locale:
              localeHint ??
              (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("fr")
                ? "fr"
                : undefined),
          }),
          signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { errors?: SpellErr[] };
        setErrors(Array.isArray(data.errors) ? data.errors : []);
      },
      [localeHint]
    );

    useEffect(() => {
      const ac = new AbortController();
      const t = window.setTimeout(() => {
        void runCheck(value, ac.signal).catch((e) => {
          if ((e as Error).name !== "AbortError") {
            /* optional UX */
          }
        });
      }, DEBOUNCE_MS);
      return () => {
        window.clearTimeout(t);
        ac.abort();
      };
    }, [value, runCheck]);

    const syncScroll = () => {
      const el = innerRef.current;
      const m = mirrorRef.current;
      if (!el || !m) return;
      m.scrollTop = el.scrollTop;
      m.scrollLeft = el.scrollLeft;
    };

    const runFix = useCallback(async () => {
      if (!value.trim()) return;
      setFixing(true);
      try {
        const res = await fetch("/api/spell/correct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: value,
            locale:
              localeHint ??
              (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("fr")
                ? "fr"
                : undefined),
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { text?: string };
        if (typeof data.text === "string") onChange(data.text);
      } finally {
        setFixing(false);
      }
    }, [value, onChange, localeHint]);

    useImperativeHandle(ref, () => ({
      fix: runFix,
      focus: () => innerRef.current?.focus(),
    }), [runFix]);

    const mirrorContent = mirrorNodes(value, errors, baseTextClass);

    const layerBase = `${className} box-border`;
    const placeholderMuted =
      variant === "slate"
        ? "placeholder:text-slate-500"
        : "placeholder:text-[#B3B3B3]/55";
    const fieldTransparent = `${layerBase} relative z-10 block w-full bg-transparent ${caretClass} text-transparent ${placeholderMuted} shadow-none outline-none focus:ring-0`;

    const mirrorShell = `${layerBase} pointer-events-none absolute inset-0 z-0 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${multiline ? "whitespace-pre-wrap break-words" : "whitespace-pre"}`;

    return (
      <div className={`relative ${wrapperClassName}`}>
        <div className={showFixButton ? (multiline ? "pr-[4.5rem] sm:pr-[5rem]" : "pr-20") : ""}>
          <div className="relative">
            <div ref={mirrorRef} className={mirrorShell} aria-hidden="true">
              {mirrorContent.length ? (
                mirrorContent
              ) : value ? null : (
                <span className="inline-block min-h-[1em] opacity-0">.</span>
              )}
            </div>
            {multiline ? (
              <textarea
                ref={innerRef as React.RefObject<HTMLTextAreaElement | null>}
                id={id}
                name={name}
                required={required}
                disabled={disabled}
                rows={rows}
                placeholder={placeholder}
                value={value}
                aria-invalid={ariaInvalid}
                spellCheck={false}
                autoComplete={autoComplete}
                className={`${fieldTransparent} resize-y`}
                onChange={(e) => onChange(e.target.value)}
                onScroll={syncScroll}
              />
            ) : (
              <input
                ref={innerRef as React.RefObject<HTMLInputElement | null>}
                id={id}
                name={name}
                type="text"
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                value={value}
                aria-invalid={ariaInvalid}
                spellCheck={false}
                autoComplete={autoComplete}
                inputMode={inputMode}
                className={`${fieldTransparent} resize-none`}
                onChange={(e) => onChange(e.target.value)}
                onScroll={syncScroll}
              />
            )}
          </div>
        </div>
        {showFixButton ? (
          <button
            type="button"
            onClick={() => void runFix()}
            disabled={Boolean(disabled) || fixing || !value.trim()}
            className={
              fixButtonClassName ||
              `pointer-events-auto absolute right-0 top-0 z-20 translate-y-0 rounded-md border border-[#C9A646]/45 bg-[#0B0B0B]/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#C9A646] shadow-md backdrop-blur-sm transition hover:border-[#C9A646]/80 hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 ${
                variant === "slate"
                  ? "border-emerald-500/40 bg-slate-950/95 text-emerald-300 hover:border-emerald-400/70"
                  : ""
              }`
            }
          >
            {fixing ? "…" : "Fix text"}
          </button>
        ) : null}
      </div>
    );
  }
);
