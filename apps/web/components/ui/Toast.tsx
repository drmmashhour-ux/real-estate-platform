type ToastProps = {
  message: string;
  type: "success" | "error";
  className?: string;
};

/**
 * Presentational toast for static layouts or tests. Prefer `ToastProvider` + `useToast` for app-wide toasts.
 */
export function Toast({ message, type, className = "" }: ToastProps) {
  return (
    <div
      role="status"
      className={`fixed bottom-5 right-5 rounded-xl px-4 py-3 text-sm shadow-lg ${
        type === "success" ? "bg-emerald-500 text-black" : "bg-red-500 text-white"
      } ${className}`.trim()}
    >
      {message}
    </div>
  );
}
