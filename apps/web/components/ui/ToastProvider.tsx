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
            className={`pointer-events-auto rounded-xl border px-5 py-3.5 text-center text-xs font-black uppercase tracking-widest shadow-2xl transition-all duration-300 animate-slide-up ${
              t.variant === "success"
                ? "border-premium-gold/50 bg-black/90 text-premium-gold shadow-premium-gold/20"
                : t.variant === "warning"
                  ? "border-amber-500/50 bg-black/90 text-amber-500 shadow-amber-500/10"
                  : t.variant === "error"
                    ? "border-red-500/50 bg-black/90 text-red-500 shadow-red-500/10"
                    : "border-white/10 bg-black/90 text-white"
            }`}
            role="status"
          >
            <div className="flex items-center justify-center gap-3">
              {t.variant === "success" && <span className="h-1.5 w-1.5 rounded-full bg-premium-gold animate-pulse" />}
              {t.message}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
