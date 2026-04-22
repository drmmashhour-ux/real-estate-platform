"use client";

import { ChatBubble } from "@/components/soins/ChatBubble";

export type ChatLineVm = {
  id: string;
  role: "family" | "resident" | "staff" | "system";
  message: string;
  timeLabel: string;
  align: "left" | "right";
};

export function SoinsChatThreadClient(props: { lines: ChatLineVm[] }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      {props.lines.map((l) => (
        <ChatBubble key={l.id} role={l.role} message={l.message} time={l.timeLabel} align={l.align} />
      ))}
    </div>
  );
}
