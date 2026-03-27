import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { mobileFetch } from "../services/apiClient";

export type AppRole = "guest" | "host" | "admin";

type MeResponse = {
  user: { id: string; email: string | null; name: string | null; platformRole: string };
  appRole: AppRole;
  hostListingCount: number;
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
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? { access_token: data.session.access_token } : null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ? { access_token: s.access_token } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;
    void refreshMe();
  }, [ready, session?.access_token, refreshMe]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setMe(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ ready, session, me, profileLoadFailed, refreshMe, signOut }),
    [ready, session, me, profileLoadFailed, refreshMe, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
