"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TEST_SAMPLE_PATH = "/bnhub/fixtures/test-identity-sample.png";

const showTestSampleUi =
  process.env.NEXT_PUBLIC_BNHUB_ID_TEST_SAMPLE === "1" || process.env.NODE_ENV === "development";

export function IdVerificationForm() {
  const router = useRouter();
  const [govFile, setGovFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitFiles(g: File | null, s: File | null) {
    if (!g?.size && !s?.size) {
      setError("Upload at least a government ID or a selfie.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      if (g?.size) formData.set("government_id_file", g);
      if (s?.size) formData.set("selfie_photo", s);
      const res = await fetch("/api/identity-verification", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitFiles(govFile, selfieFile);
  }

  async function useTestSampleFiles() {
    setTestLoading(true);
    setError(null);
    try {
      const res = await fetch(TEST_SAMPLE_PATH);
      if (!res.ok) throw new Error("Could not load test sample image.");
      const blob = await res.blob();
      const gov = new File([blob], "test-government-id.png", { type: "image/png" });
      const selfie = new File([blob], "test-selfie.png", { type: "image/png" });
      setGovFile(gov);
      setSelfieFile(selfie);
      await submitFiles(gov, selfie);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test upload failed");
    } finally {
      setTestLoading(false);
    }
  }

  const fileInputClass =
    "mt-2 block w-full text-sm text-neutral-300 file:mr-4 file:cursor-pointer file:rounded-xl file:border file:border-premium-gold/40 file:bg-premium-gold/10 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-premium-gold file:transition file:hover:border-premium-gold/60 file:hover:bg-premium-gold/15";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-6 rounded-2xl border border-premium-gold/25 bg-black/50 p-6 shadow-[0_24px_80px_rgb(0_0_0/0.45)] backdrop-blur-md sm:p-8"
    >
      {showTestSampleUi ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
          <p className="font-medium text-amber-50">Local / QA test upload</p>
          <p className="mt-1 text-xs text-amber-200/80">
            Uses a tiny PNG placeholder for both fields and submits — valid for pipeline testing only.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={loading || testLoading}
              onClick={() => void useTestSampleFiles()}
              className="rounded-xl border border-amber-400/50 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-500/25 disabled:opacity-50"
            >
              {testLoading || (loading && (govFile || selfieFile)) ? "Uploading…" : "Upload test sample ID + selfie"}
            </button>
            <a
              href={TEST_SAMPLE_PATH}
              download="bnhub-test-identity-sample.png"
              className="text-xs font-medium text-amber-300/90 underline-offset-2 hover:underline"
            >
              Download sample PNG
            </a>
          </div>
        </div>
      ) : null}
      <div>
        <label className="block text-sm font-medium text-premium-gold/90">
          Government-issued ID (passport, driver&apos;s license)
        </label>
        <p className="mt-0.5 text-xs text-neutral-500">PNG, JPG, or PDF — max size per your browser limits.</p>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setGovFile(e.target.files?.[0] ?? null)}
          className={fileInputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-premium-gold/90">Selfie (face clearly visible)</label>
        <p className="mt-0.5 text-xs text-neutral-500">Well-lit photo — JPG or PNG.</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
          className={fileInputClass}
        />
      </div>
      {error ? <p className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="min-h-[48px] w-full rounded-2xl bg-premium-gold px-6 py-3 text-sm font-bold text-black shadow-lg shadow-amber-900/20 transition hover:bg-[#e5c76b] disabled:opacity-50 sm:w-auto sm:min-w-[220px]"
      >
        {loading ? "Uploading…" : "Submit for verification"}
      </button>
    </form>
  );
}
