import "react-native-gesture-handler";

if (__DEV__) {
  console.log("SUPABASE URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
  const hasAnon = Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.length);
  console.log("[bnhub-mobile] EXPO_PUBLIC_SUPABASE_ANON_KEY set:", hasAnon ? "yes" : "no");
}

import { useCallback, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BrandedSplashTransition } from "../components/BrandedSplashTransition";
import { LecipmManagerBootstrap } from "../components/LecipmManagerBootstrap";
import { MobileI18nProvider } from "../i18n/I18nProvider";
import { AuthProvider } from "../hooks/useAuth";
import { trackBnhubEvent } from "../lib/bnhubTrack";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function BnhubSoftLaunchTracking() {
  useEffect(() => {
    void trackBnhubEvent("app_open");
  }, []);
  return null;
}

/** Guest-first: no global auth gate; `Stack` only inside providers for React Query + optional `/me` screens. */
export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const onSplashComplete = useCallback(() => setSplashDone(true), []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <MobileI18nProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <LecipmManagerBootstrap />
            <BnhubSoftLaunchTracking />
            {!splashDone ? <BrandedSplashTransition onComplete={onSplashComplete} /> : null}
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade",
                contentStyle: { backgroundColor: "#000000" },
              }}
            />
          </AuthProvider>
        </MobileI18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
