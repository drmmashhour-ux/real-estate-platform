import { growthAutomationJsonCompletion } from "@/src/modules/growth-automation/infrastructure/growthAutomationLlm";

export type ThumbnailSpec = {
  aspectRatio: "16:9" | "1:1" | "9:16";
  headline: string;
  subhead?: string;
  colorBg: string;
  colorFg: string;
  safeAreaNote: string;
};

export async function generateThumbnailSpec(args: { topic: string; channel: string }): Promise<ThumbnailSpec> {
  const res = await growthAutomationJsonCompletion<ThumbnailSpec>({
    system: "Thumbnail layout spec JSON for designers. No stock photo URLs.",
    user: JSON.stringify(args),
    label: "thumb_spec",
  });
  if (!res.ok) {
    return {
      aspectRatio: args.channel === "INSTAGRAM" ? "1:1" : "16:9",
      headline: args.topic.slice(0, 40),
      subhead: "LECIPM",
      colorBg: "#0f172a",
      colorFg: "#f8fafc",
      safeAreaNote: "Keep text inside central 80%",
    };
  }
  return res.data;
}
