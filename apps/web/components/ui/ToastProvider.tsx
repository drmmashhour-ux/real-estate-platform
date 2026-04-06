"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Variant = "success" | "info" | "warning" | "error";

type Toast = { id: string; message: string; variant: Variant };

type ToastContextValue = {
  showToast: (message: string, variant?: Variant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {
        /* no-op outside provider */
      },
    };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: Variant = "info") => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-24 left-1/2 z-[200] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-10"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-center text-sm font-medium shadow-lg ${
              t.variant === "success"
                ? "border-emerald-500/40 bg-emerald-950/95 text-emerald-100"
                : t.variant === "warning"
                  ? "border-amber-500/50 bg-amber-950/95 text-amber-50"
                  : t.variant === "error"
                    ? "border-red-500/50 bg-red-600 text-white"
                    : "border-white/15 bg-[#1a1a1a]/95 text-white"
            }`}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
