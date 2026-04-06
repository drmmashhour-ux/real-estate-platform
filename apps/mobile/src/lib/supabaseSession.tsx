import type { Session } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_DISABLED } from "../config/dev";
import { supabase } from "./supabase";

export type AuthSessionCtx = {
  session: Session | null;
  loading: boolean;
};

const Ctx = createContext<AuthSessionCtx | null>(null);

const guestValue: AuthSessionCtx = { session: null, loading: false };

/**
 * Supabase session context. When `AUTH_DISABLED`, skips listeners and exposes a static guest value.
 */
export function SupabaseSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!AUTH_DISABLED);

  useEffect(() => {
    if (AUTH_DISABLED) {
      setSession(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    if (!supabase) {
      setSession(null);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => (AUTH_DISABLED ? guestValue : { session, loading }),
    [session, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthSessionCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within SupabaseSessionProvider");
  return v;
}
