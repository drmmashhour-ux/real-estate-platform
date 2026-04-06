import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../config";
import { buildAuthHeaders } from "../../lib/authHeaders";
import { useAppAuth } from "../../hooks/useAuth";
import { colors } from "../../theme/colors";

type Msg = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string | null; email: string | null };
};

export default function BookingChatScreen() {
  const router = useRouter();
  const { bookingId: rawId } = useLocalSearchParams<{ bookingId: string | string[] }>();
  const bookingId = typeof rawId === "string" ? rawId : rawId?.[0] ?? "";
  const { me } = useAppAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/mobile/bnhub/messages?bookingId=${encodeURIComponent(bookingId)}`;
      const headers = await buildAuthHeaders();
      const res = await fetch(url, { headers });
      const data = (await res.json().catch(() => ({}))) as {
        messages?: Msg[];
        booking?: { listingTitle?: string };
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not load messages");
        setMessages([]);
        return;
      }
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setTitle(data.booking?.listingTitle ?? "Booking chat");
    } catch {
      setError("Network error");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    const body = draft.trim();
    if (!body || !bookingId) return;
    setSending(true);
    setError(null);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/mobile/bnhub/messages`;
      const headers = await buildAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ bookingId, body }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: Msg; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Send failed");
        return;
      }
      if (data.message) {
        setMessages((m) => [...m, data.message as Msg]);
        setDraft("");
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch {
      setError("Network error");
    } finally {
      setSending(false);
    }
  }

  if (!bookingId) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.err}>Missing booking id.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.headTitle} numberOfLines={1}>
            {title || "Messages"}
          </Text>
        </View>

        {loading ? <ActivityIndicator color={colors.gold} style={{ marginTop: 24 }} /> : null}
        {error ? <Text style={styles.errBanner}>{error}</Text> : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = Boolean(me?.user?.id && item.sender.id === me.user.id);
            return (
              <View style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
                  <Text style={styles.meta}>
                    {item.sender.name ?? item.sender.email ?? "User"} · {item.createdAt.slice(11, 16)}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.compose}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
            maxLength={4000}
          />
          <Pressable
            onPress={() => void send()}
            disabled={sending || !draft.trim()}
            style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.9 }, sending && { opacity: 0.5 }]}
          >
            <Text style={styles.sendLabel}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  back: { color: colors.gold, fontWeight: "800", fontSize: 16 },
  headTitle: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 10 },
  list: { padding: 16, paddingBottom: 8 },
  bubbleWrap: { marginBottom: 10, maxWidth: "88%" },
  bubbleWrapMine: { alignSelf: "flex-end" },
  bubbleWrapTheirs: { alignSelf: "flex-start" },
  bubble: { borderRadius: 14, padding: 12 },
  bubbleMine: { backgroundColor: colors.gold },
  bubbleTheirs: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  bubbleTextMine: { color: "#0a0a0a" },
  meta: { color: colors.muted, fontSize: 10, marginTop: 6 },
  compose: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 16,
  },
  sendBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  sendLabel: { color: "#0a0a0a", fontWeight: "900" },
  err: { color: colors.danger, padding: 16 },
  errBanner: { color: colors.danger, textAlign: "center", padding: 8 },
});
