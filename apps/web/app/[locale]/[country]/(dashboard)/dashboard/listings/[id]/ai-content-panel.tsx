"use client";

import { useState, useEffect } from "react";

export function AiContentPanel({ listingId }: { listingId: string }) {
  const [aiContent, setAiContent] = useState<{
    title?: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/ai/listing-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    })
      .then((res) => res.json())
      .then(setAiContent)
      .catch(console.error);
  }, [listingId]);

  if (!aiContent) return null;

  return (
    <div style={{ background: "#f5f5f5", padding: 12 }}>
      <h3>AI Content</h3>
      <p>{aiContent.title}</p>
      <p>{aiContent.description}</p>
    </div>
  );
}
