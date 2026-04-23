import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { registerMobileDevice } from "../api/client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushRegistration(enabled: boolean) {
  const [status, setStatus] = useState<"idle" | "registering" | "registered" | "unsupported" | "error">("idle");

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function register() {
      if (!Device.isDevice) {
        if (!cancelled) setStatus("unsupported");
        return;
      }

      try {
        if (!cancelled) setStatus("registering");

        const permission = await Notifications.getPermissionsAsync();
        let finalStatus = permission.status;

        if (finalStatus !== "granted") {
          const requested = await Notifications.requestPermissionsAsync();
          finalStatus = requested.status;
        }

        if (finalStatus !== "granted") {
          if (!cancelled) setStatus("unsupported");
          return;
        }

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;

        const tokenResult = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );

        await registerMobileDevice({
          token: tokenResult.data,
          platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web",
          provider: "expo",
          deviceName: Device.deviceName ?? null,
          appVersion: Constants.expoConfig?.version ?? null,
        });

        if (!cancelled) setStatus("registered");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void register();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return status;
}
