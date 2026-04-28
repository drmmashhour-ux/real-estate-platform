"use client";

import { createContext, useContext } from "react";

export type StoryOverlayModel = {
  visible: boolean;
  banner: string;
  title: string;
  subtitle: string | null;
  sceneLabel: string;
  progress01: number;
};

export type StoryModeContextValue = {
  running: boolean;
  paused: boolean;
  overlay: StoryOverlayModel;
  startStoryMode: () => Promise<"completed" | "aborted">;
  togglePause: () => void;
  skipScene: () => void;
  stopStoryMode: () => void;
};

export const StoryModeContext = createContext<StoryModeContextValue | null>(null);

export function useStoryMode(): StoryModeContextValue | null {
  return useContext(StoryModeContext);
}
