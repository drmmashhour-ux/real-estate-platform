"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Absolute URL to encode (built on the client when the user opens the modal). */
  targetUrl: string;
  /** Used for download filename only. */
  adCode: string;
};

/**
 * SY-29: On-demand QR — `qrcode` is loaded only when this modal is open (dynamic `import()`).
 */
export function QRModal({ isOpen, onClose, targetUrl, adCode }: Props) {
  const t = useTranslations("Listing");
  const titleId = useId();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen || !targetUrl) return;
    let cancelled = false;
    setDataUrl(null);
    setError(false);
    setLoading(true);
    void (async () => {
      try {
        const QR = (await import("qrcode")).default;
        const url = await QR.toDataURL(targetUrl, {
          width: 280,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        if (!cancelled) setDataUrl(url);
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, targetUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen) return null;

  const filename = `hadiah-${adCode.replace(/[^a-zA-Z0-9-]/g, "_")}.png`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label={t("qrClose")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] w-full max-w-sm rounded-2xl border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-4 shadow-xl [dir:rtl]:text-right"
      >
        <h2 id={titleId} className="text-base font-bold text-[color:var(--darlink-text)]">
          {t("qrModalTitle")}
        </h2>
        <div className="mt-4 flex min-h-[200px] items-center justify-center rounded-xl border border-[color:var(--darlink-border)] bg-white p-4">
          {loading ? (
            <p className="text-sm text-[color:var(--darlink-text-muted)]">{t("qrLoading")}</p>
          ) : error || !dataUrl ? (
            <p className="text-center text-sm text-red-700">{t("qrError")}</p>
          ) : (
            <img
              src={dataUrl}
              width={280}
              height={280}
              className="h-auto w-full max-w-[280px] object-contain"
              alt=""
            />
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {dataUrl && !loading && !error ? (
            <a
              href={dataUrl}
              download={filename}
              className="inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-xl bg-[color:var(--darlink-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 sm:w-auto"
            >
              {t("qrSaveImage")}
            </a>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-xl border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--darlink-text)] hover:bg-[color:var(--darlink-surface-muted)] sm:w-auto"
          >
            {t("qrClose")}
          </button>
        </div>
      </div>
    </div>
  );
}
