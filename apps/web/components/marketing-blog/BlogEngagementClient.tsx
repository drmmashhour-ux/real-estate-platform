"use client";

import * as React from "react";

export function BlogEngagementClient({
  blogId,
  slug,
  publicUrl,
}: {
  blogId: string;
  slug: string;
  publicUrl: string;
}) {
  const sent = React.useRef(false);

  React.useEffect(() => {
    if (sent.current || !blogId) return;
    sent.current = true;
    let sessionId: string | undefined;
    if (typeof window !== "undefined") {
      sessionId = window.sessionStorage.getItem("lecipm_mi_sid") ?? undefined;
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        window.sessionStorage.setItem("lecipm_mi_sid", sessionId);
      }
    }
    void fetch("/api/marketing-intelligence/v1/blog-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ blogId, slug, sessionId, kind: "blog_view" }),
    }).catch(() => {});
  }, [blogId, slug]);

  const onShare = (channel: "facebook" | "linkedin" | "x") => {
    if (typeof window === "undefined") return;
    const sid = window.sessionStorage.getItem("lecipm_mi_sid") ?? undefined;
    void fetch("/api/marketing-intelligence/v1/blog-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ blogId, slug, kind: "blog_click", sessionId: sid }),
    }).catch(() => {});

    const enc = encodeURIComponent(publicUrl);
    const titleEnc = encodeURIComponent(document.title);
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}`,
      x: `https://twitter.com/intent/tweet?text=${titleEnc}&url=${enc}`,
    };
    window.open(urls[channel], "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-6">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Share</span>
      <button
        type="button"
        onClick={() => onShare("facebook")}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
      >
        Facebook
      </button>
      <button
        type="button"
        onClick={() => onShare("linkedin")}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
      >
        LinkedIn
      </button>
      <button
        type="button"
        onClick={() => onShare("x")}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
      >
        X
      </button>
    </div>
  );
}
