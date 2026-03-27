"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IdVerificationForm() {
  const router = useRouter();
  const [govFile, setGovFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!govFile?.size && !selfieFile?.size) {
      setError("Upload at least a government ID or a selfie.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      if (govFile?.size) formData.set("government_id_file", govFile);
      if (selfieFile?.size) formData.set("selfie_photo", selfieFile);
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

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Government-issued ID (passport, driver’s license)
        </label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setGovFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-slate-700"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Selfie (face clearly visible)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-slate-700"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "Uploading…" : "Submit for verification"}
      </button>
    </form>
  );
}
