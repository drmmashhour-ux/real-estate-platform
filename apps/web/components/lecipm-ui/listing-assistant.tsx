"use client";

import type { TextareaHTMLAttributes } from "react";

import { Card } from "@/components/lecipm-ui/card";
import { PrimaryButton } from "@/components/lecipm-ui/primary-button";

export function ListingAssistant({
  title = "AI Listing Assistant",
  onGenerate,
  textareaProps,
}: {
  title?: string;
  onGenerate?: () => void;
  textareaProps?: TextareaHTMLAttributes<HTMLTextAreaElement>;
}) {
  return (
    <Card>
      <div className="mb-4 text-xl font-semibold text-white">{title}</div>
      <textarea
        className="w-full rounded-lg border border-[#333333] bg-black p-3 text-sm text-white placeholder:text-neutral-500 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/30"
        placeholder="Generate description..."
        rows={5}
        {...textareaProps}
      />
      <PrimaryButton className="mt-4" onClick={onGenerate}>
        Generate
      </PrimaryButton>
    </Card>
  );
}
