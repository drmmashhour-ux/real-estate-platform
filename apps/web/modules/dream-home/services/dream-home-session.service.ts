import { cookies } from "next/headers";
import type { DreamHomeSessionState } from "../types/dream-home.types";
import { normalizeQuestionnaire } from "../utils/dream-home-normalize";

const COOKIE = "dream_home_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function safeParse(s: string | undefined): DreamHomeSessionState | null {
  if (!s?.length) {
    return null;
  }
  try {
    const o = JSON.parse(s) as DreamHomeSessionState;
    if (o && typeof o.step === "number" && o.questionnaire && typeof o === "object") {
      o.questionnaire = normalizeQuestionnaire(o.questionnaire) as DreamHomeSessionState["questionnaire"];
      return o;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * In-progress wizard state in an httpOnly-style cookie. Never throws; returns null on read failure.
 */
export async function getDreamHomeSession(): Promise<DreamHomeSessionState | null> {
  try {
    const jar = await cookies();
    return safeParse(jar.get(COOKIE)?.value);
  } catch {
    return null;
  }
}

export async function setDreamHomeSession(state: DreamHomeSessionState): Promise<void> {
  try {
    const jar = await cookies();
    const body: DreamHomeSessionState = {
      step: state.step,
      questionnaire: normalizeQuestionnaire(state.questionnaire) as DreamHomeSessionState["questionnaire"],
      updatedAt: new Date().toISOString(),
    };
    const encoded = JSON.stringify(body);
    if (encoded.length > 3800) {
      return;
    }
    jar.set(COOKIE, encoded, { path: "/", sameSite: "lax", maxAge: MAX_AGE, httpOnly: true, secure: process.env.NODE_ENV === "production" });
  } catch {
    /* no-op */
  }
}

export async function clearDreamHomeSession(): Promise<void> {
  try {
    const jar = await cookies();
    jar.set(COOKIE, "", { path: "/", maxAge: 0 });
  } catch {
    /* */
  }
}
