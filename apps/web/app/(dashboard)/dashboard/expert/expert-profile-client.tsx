"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const GOLD = "#C9A646";

type Expert = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  bio: string | null;
  title: string | null;
  photo: string | null;
  isActive: boolean;
};

export function ExpertProfileClient() {
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [bio, setBio] = useState("");
  const [title, setTitle] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/mortgage/expert/profile", { credentials: "same-origin" });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = (await res.json()) as Expert;
    setExpert(data);
    setName(data.name);
    setPhone(data.phone ?? "");
    setCompany(data.company ?? "");
    setBio(data.bio ?? "");
    setTitle(data.title ?? "");
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/mortgage/expert/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, phone, company, bio, title }),
      });
      const j = await res.json().catch(() => ({}));
      /** @-expect-error */
      if (!res.ok) {
        setMsg(typeof j.error === "string" ? j.error : "Save failed");
        return;
      }
      setExpert(j);
      setMsg("Profile saved.");
    } finally {
      setSaving(false);
    }
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    setMsg("");
    const res = await fetch("/api/mortgage/expert/photo", {
      method: "POST",
      body: fd,
      credentials: "same-origin",
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg(typeof j.error === "string" ? j.error : "Upload failed");
      return;
    }
    setMsg("Photo updated.");
    await load();
    e.target.value = "";
  };

  if (loading) {
    return <p className="mt-8 text-[#B3B3B3]">Loading…</p>;
  }
  if (!expert) {
    return <p className="mt-8 text-red-300">Could not load profile.</p>;
  }

  const photoSrc = expert.photo || null;

  return (
    <div className="mt-8 space-y-8 rounded-2xl border border-white/10 bg-[#121212] p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-2 border-[#C9A646]/50 bg-[#0B0B0B]">
            {photoSrc ? (
              <Image
                src={photoSrc}
                alt=""
                fill
                className="object-cover"
                sizes="128px"
                unoptimized={photoSrc.startsWith("/uploads")}
              />
            ) : (
              <span className="flex h-full items-center justify-center text-xs text-[#737373]">No photo</span>
            )}
          </div>
          <label className="cursor-pointer text-xs font-semibold text-[#C9A646] hover:underline">
            Upload photo
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />
          </label>
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <p className="text-xs text-[#737373]">
            Status:{" "}
            <span style={{ color: expert.isActive ? GOLD : "#f87171" }}>
              {expert.isActive ? "Active (visible + receiving leads)" : "Inactive"}
            </span>
          </p>
          <div>
            <label className="text-xs font-semibold uppercase text-[#C9A646]/90">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-[#C9A646]/90">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mortgage specialist"
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-[#C9A646]/90">Email (login)</label>
            <input
              value={expert.email}
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-[#737373]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-[#C9A646]/90">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-[#C9A646]/90">Company</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-[#C9A646]/90">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm"
            />
          </div>
          {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-xl px-6 py-3 text-sm font-bold text-[#0B0B0B] disabled:opacity-50"
            style={{ background: GOLD }}
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
