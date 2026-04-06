import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_DISABLED } from "../config/dev";
import { supabase } from "../lib/supabase";
import { mobileFetch } from "../services/apiClient";
import { clearStoredAccessToken, persistAccessToken } from "../services/auth";

export type AppRole = "guest" | "host" | "admin";

export type IdentityVerificationSummary = {
  isVerified: boolean;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
};

type MeResponse = {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    platformRole: string;
    /** Government ID approved (optional progressive verification). */
    isVerified?: boolean;
    verificationStatus?: IdentityVerificationSummary["verificationStatus"];
    /** BNHub guest trust snapshot (0–100). */
    trustScore?: number;
    totalStays?: number;
    /** Average host rating of this guest (1–5). */
    rating?: number | null;
  };
  identityVerification?: IdentityVerificationSummary;
  trust?: { trustScore: number; totalStays: number; rating: number | null; badges: string[] };
  appRole: AppRole;
  hostListingCount: number;
  /** BNHub `listings.host_user_id` count for the Supabase Auth id (JWT). */
  bnhubHostListingCount?: number;
};

type AuthCtx = {
  ready: boolean;
  session: { access_token: string } | null;
  me: MeResponse | null;
  profileLoadFailed: boolean;
  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);

  const refreshMe = useCallback(async () => {
    if (!supabase) {
      setMe(null);
      setProfileLoadFailed(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    const tok = data.session?.access_token;
    if (!tok) {
      setMe(null);
      setProfileLoadFailed(false);
      return;
    }
    try {
      const m = await mobileFetch<MeResponse>("/api/mobile/v1/me");
      setMe(m);
      setProfileLoadFailed(false);
    } catch {
      setMe(null);
      setProfileLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    if (AUTH_DISABLED) {
      setSession(null);
      setMe(null);
      setProfileLoadFailed(false);
      setReady(true);
      return;
    }
    if (!supabase) {
      setReady(true);
      return;
    }
    void supabase.auth.getSession().then(async ({ data }) => {
      const tok = data.session?.access_token ?? null;
      if (tok) await persistAccessToken(tok);
      else await clearStoredAccessToken();
      setSession(data.session ? { access_token: data.session.access_token } : null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      void (async () => {
        const t = s?.access_token ?? null;
        if (t) await persistAccessToken(t);
        else await clearStoredAccessToken();
      })();
      setSession(s ? { access_token: s.access_token } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (AUTH_DISABLED || !ready) return;
    void refreshMe();
  }, [ready, session?.access_token, refreshMe]);

  const signOut = useCallback(async () => {
    if (AUTH_DISABLED) {
      setMe(null);
      setSession(null);
      return;
    }
    if (supabase) await supabase.auth.signOut();
    await clearStoredAccessToken();
    setMe(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ ready, session, me, profileLoadFailed, refreshMe, signOut }),
    [ready, session, me, profileLoadFailed, refreshMe, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppAuth outside AuthProvider");
  return v;
}
