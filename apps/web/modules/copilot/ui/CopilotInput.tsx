"use client";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export function CopilotInput({ value, onChange, onSubmit, disabled, placeholder }: Props) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        disabled={disabled}
        placeholder={placeholder ?? "Ask Copilot…"}
        className="min-h-[44px] flex-1 rounded-xl border border-white/15 bg-black/40 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:border-premium-gold/50 focus:outline-none"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="rounded-xl bg-premium-gold px-5 py-2 text-sm font-bold text-black disabled:opacity-40"
      >
        Send
      </button>
    </div>
  );
}
