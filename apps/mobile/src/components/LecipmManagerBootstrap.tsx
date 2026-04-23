import { useEffect } from "react";
import { Alert, Platform } from "react-native";
import { useAppAuth } from "../hooks/useAuth";
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  registerForPushNotificationsAsync,
} from "@/lib/notifications";

/**
 * Push registration + in-app notification listeners for LECIPM Manager (root layout).
 */
export function LecipmManagerBootstrap() {
  const { ready, session } = useAppAuth();

  useEffect(() => {
    if (!ready || !session?.access_token) return;
    void registerForPushNotificationsAsync();
  }, [ready, session?.access_token]);

  useEffect(() => {
    const subA = addNotificationReceivedListener((n) => {
      if (__DEV__) {
        const title = n.request.content.title ?? "";
        const body = n.request.content.body ?? "";
        console.log("[lecipm push]", title, body);
      }
    });
    const subB = addNotificationResponseListener((r) => {
      const title = r.notification.request.content.title ?? "LECIPM Manager";
      const body = r.notification.request.content.body ?? "";
      if (Platform.OS !== "web") {
        Alert.alert(title, body);
      }
    });
    return () => {
      subA.remove();
      subB.remove();
    };
  }, []);

  return null;
}
