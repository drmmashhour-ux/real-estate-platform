import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoldButton } from "../components/ui/GoldButton";
import { API_BASE_URL } from "../config";
import { AUTH_DISABLED } from "../config/dev";
import { useAppAuth } from "../hooks/useAuth";
import { buildAuthHeaders } from "../lib/authHeaders";
import { colors } from "../theme/colors";

export default function VerifyIdentityScreen() {
  const router = useRouter();
  const { session, me, refreshMe } = useAppAuth();
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [mimeHint, setMimeHint] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const status = me?.identityVerification?.verificationStatus ?? "unverified";
  const isVerified = me?.identityVerification?.isVerified === true;

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photos", "Allow photo library access to choose an ID image.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    setLocalUri(a.uri);
    setMimeHint(a.mimeType ?? "image/jpeg");
  }, []);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera", "Allow camera access to photograph your ID.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    setLocalUri(a.uri);
    setMimeHint(a.mimeType ?? "image/jpeg");
  }, []);

  const upload = useCallback(async () => {
    if (AUTH_DISABLED) {
      Alert.alert("Development", "Turn off AUTH_DISABLED to upload an ID against the API.");
      return;
    }
    if (!session) {
      Alert.alert("Sign in required", "Create an account or sign in to verify your identity.", [
        { text: "OK", onPress: () => router.replace("/(auth)/sign-in") },
      ]);
      return;
    }
    if (!localUri) {
      Alert.alert("Add a photo", "Choose or capture an image of your government ID.");
      return;
    }
    setUploading(true);
    try {
      const uri = localUri;
      const name = uri.split("/").pop() || "id.jpg";
      const type = mimeHint || "image/jpeg";
      const form = new FormData();
      form.append("file", { uri, name, type } as unknown as Blob);
      const base = API_BASE_URL.replace(/\/$/, "");
      const headers = await buildAuthHeaders();
      delete (headers as Record<string, string>)["Content-Type"];
      const res = await fetch(`${base}/api/mobile/v1/me/identity/document`, {
        method: "POST",
        headers,
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        Alert.alert("Upload failed", typeof data.error === "string" ? data.error : "Try again.");
        return;
      }
      await refreshMe();
      setLocalUri(null);
      Alert.alert("Submitted", data.message ?? "We received your ID and will review it soon.");
    } catch {
      Alert.alert("Network error", "Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }, [localUri, mimeHint, refreshMe, router, session]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.kicker}>TRUST & SAFETY</Text>
        <Text style={styles.head}>Verify your identity</Text>
        <Text style={styles.body}>
          Optional verification helps hosts and guests trust each other. Upload a clear photo of your government-issued ID.
          We never show your ID on your public profile.
        </Text>

        {isVerified ? (
          <View style={styles.statusOk}>
            <Text style={styles.statusOkText}>You are verified. No further action needed.</Text>
          </View>
        ) : status === "pending" ? (
          <View style={styles.statusPending}>
            <Text style={styles.statusPendingText}>
              Your ID is under review. We will notify you when the status changes.
            </Text>
          </View>
        ) : status === "rejected" ? (
          <View style={styles.statusRejected}>
            <Text style={styles.statusRejectedText}>
              Previous submission could not be approved. Upload a new, well-lit image of your ID.
            </Text>
          </View>
        ) : null}

        <Text style={styles.section}>Selfie check</Text>
        <Text style={styles.muted}>Face matching is not enabled yet — ID upload only for now.</Text>

        {localUri ? (
          <Image source={{ uri: localUri }} style={styles.preview} accessibilityLabel="Selected ID preview" />
        ) : (
          <View style={styles.previewPh}>
            <Text style={styles.previewPhText}>No image selected</Text>
          </View>
        )}

        <View style={styles.row}>
          <GoldButton label="Choose from library" onPress={() => void pickImage()} disabled={uploading || isVerified} />
        </View>
        <View style={styles.row}>
          <GoldButton label="Take photo" onPress={() => void takePhoto()} disabled={uploading || isVerified} />
        </View>

        <Pressable
          style={[styles.primaryBtn, (uploading || isVerified || !localUri) && styles.primaryBtnDisabled]}
          onPress={() => void upload()}
          disabled={uploading || isVerified || !localUri}
        >
          {uploading ? (
            <ActivityIndicator color="#0B0B0B" />
          ) : (
            <Text style={styles.primaryLabel}>{isVerified ? "Verified" : "Submit ID"}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  back: { color: colors.gold, fontSize: 16, marginBottom: 16 },
  kicker: { color: colors.textMuted, fontSize: 12, letterSpacing: 1.2, marginBottom: 6 },
  head: { color: colors.text, fontSize: 26, fontWeight: "800", marginBottom: 12 },
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  section: { color: colors.text, fontSize: 16, fontWeight: "700", marginTop: 8, marginBottom: 6 },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  preview: { width: "100%", height: 200, borderRadius: 12, marginBottom: 16, backgroundColor: colors.card },
  previewPh: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  previewPhText: { color: colors.textMuted, fontSize: 14 },
  row: { marginBottom: 12 },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: colors.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryLabel: { color: "#0B0B0B", fontSize: 17, fontWeight: "800" },
  statusOk: {
    backgroundColor: "rgba(34,197,94,0.12)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  statusOkText: { color: colors.success, fontSize: 14, lineHeight: 20 },
  statusPending: {
    backgroundColor: "rgba(212,175,55,0.12)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  statusPendingText: { color: colors.gold, fontSize: 14, lineHeight: 20 },
  statusRejected: {
    backgroundColor: "rgba(239,68,68,0.12)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  statusRejectedText: { color: colors.danger, fontSize: 14, lineHeight: 20 },
});
