"use client";

export type ChatRole = "family" | "resident" | "staff" | "system";

const roleLabel: Record<ChatRole, string> = {
  family: "Famille",
  resident: "Résident",
  staff: "Équipe",
  system: "Soins",
};

export function ChatBubble(props: {
  role: ChatRole;
  message: string;
  time: string;
  /** Left = others, right = “me” */
  align?: "left" | "right";
}) {
  const mine = props.align === "right";

  return (
    <div className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-[17px] leading-relaxed ${
          mine
            ? "bg-[#D4AF37]/20 text-[#FAFAF8] ring-1 ring-[#D4AF37]/35"
            : "bg-white/8 text-[#FAFAF8] ring-1 ring-white/10"
        }`}
      >
        <div className="mb-1 flex flex-wrap items-baseline gap-2 text-xs font-medium uppercase tracking-wide text-white/50">
          <span>{roleLabel[props.role]}</span>
          <span className="font-normal text-white/35">{props.time}</span>
        </div>
        <p>{props.message}</p>
      </div>
    </div>
  );
}
