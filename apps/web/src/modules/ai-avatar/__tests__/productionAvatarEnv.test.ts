import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getLecipmAvatarVideoProvider,
  getHeyGenConfig,
  getDidConfig,
  getElevenLabsConfig,
} from "@/src/modules/ai-avatar/infrastructure/providers/productionAvatarEnv";

const KEYS = [
  "LECIPM_AVATAR_VIDEO_PROVIDER",
  "HEYGEN_API_KEY",
  "HEYGEN_AVATAR_ID",
  "HEYGEN_VOICE_ID",
  "DID_API_KEY",
  "DID_SOURCE_IMAGE_URL",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID",
] as const;

describe("productionAvatarEnv", () => {
  const snapshot: Record<string, string | undefined> = {};

  beforeAll(() => {
    for (const k of KEYS) snapshot[k] = process.env[k];
  });

  beforeEach(() => {
    delete process.env.LECIPM_AVATAR_VIDEO_PROVIDER;
    for (const k of KEYS) {
      if (k === "LECIPM_AVATAR_VIDEO_PROVIDER") continue;
      delete process.env[k];
    }
  });

  afterAll(() => {
    for (const k of KEYS) {
      if (snapshot[k] === undefined) delete process.env[k];
      else process.env[k] = snapshot[k];
    }
  });

  it("defaults provider to none when unset", () => {
    expect(getLecipmAvatarVideoProvider()).toBe("none");
  });

  it("maps unknown provider to none", () => {
    process.env.LECIPM_AVATAR_VIDEO_PROVIDER = "other";
    expect(getLecipmAvatarVideoProvider()).toBe("none");
  });

  it("parses heygen and did aliases", () => {
    process.env.LECIPM_AVATAR_VIDEO_PROVIDER = "HEYGEN";
    expect(getLecipmAvatarVideoProvider()).toBe("heygen");
    process.env.LECIPM_AVATAR_VIDEO_PROVIDER = "d-id";
    expect(getLecipmAvatarVideoProvider()).toBe("did");
  });

  it("reads vendor keys when set", () => {
    process.env.HEYGEN_API_KEY = "hk";
    process.env.HEYGEN_AVATAR_ID = "av";
    process.env.HEYGEN_VOICE_ID = "vo";
    expect(getHeyGenConfig()).toEqual({ apiKey: "hk", avatarId: "av", voiceId: "vo" });

    process.env.DID_API_KEY = "dk";
    process.env.DID_SOURCE_IMAGE_URL = "https://cdn.example/face.jpg";
    const d = getDidConfig();
    expect(d.apiKey).toBe("dk");
    expect(d.sourceImageUrl).toBe("https://cdn.example/face.jpg");

    process.env.ELEVENLABS_API_KEY = "el";
    process.env.ELEVENLABS_VOICE_ID = "v1";
    expect(getElevenLabsConfig().apiKey).toBe("el");
    expect(getElevenLabsConfig().voiceId).toBe("v1");
  });
});
