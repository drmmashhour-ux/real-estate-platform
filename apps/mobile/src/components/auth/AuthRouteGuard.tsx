import { Redirect } from "expo-router";
import type { ReactElement, ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { AUTH_DISABLED } from "../../config/dev";
import { useAppAuth } from "../../hooks/useAuth";
import { colors } from "../../theme/colors";

function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );
}

type Variant = "guest" | "host" | "admin";

/**
 * Central session + role checks for expo-router group layouts.
 * Waits for `me` when a session exists so we never flash the wrong shell mid-profile-load.
 */
export function AuthRouteGuard({ variant, children }: { variant: Variant; children: ReactNode }) {
  const { ready, session, me, profileLoadFailed } = useAppAuth();

  if (AUTH_DISABLED) return <>{children}</>;

  if (!ready) return <Loading />;
  if (!session) return <Redirect href="/(tabs)" />;
  if (profileLoadFailed) return <Redirect href="/(tabs)" />;
  if (!me) return <Loading />;

  if (variant === "guest") {
    if (me.appRole === "admin") return <Redirect href="/(admin)/dashboard" />;
    return <>{children}</>;
  }

  if (variant === "host") {
    if (me.appRole !== "host" && me.appRole !== "admin") {
      return <Redirect href="/(tabs)" />;
    }
    return <>{children}</>;
  }

  if (me.appRole !== "admin") return <Redirect href="/(tabs)" />;
  return <>{children}</>;
}

/**
 * For auth screens: if the user already has a session, return a full-screen redirect/loading
 * element so auth forms never flash underneath when already signed in.
 */
export function useAuthedEntryRedirect(): ReactElement | null {
  const { ready, session, me, profileLoadFailed } = useAppAuth();

  if (AUTH_DISABLED) return null;
  if (!ready || !session) return null;
  if (profileLoadFailed) return <Redirect href="/(tabs)" />;
  if (!me) return <Loading />;
  return <Redirect href="/(tabs)" />;
}
