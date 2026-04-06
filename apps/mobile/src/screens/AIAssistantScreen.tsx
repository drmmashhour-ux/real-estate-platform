import { useCallback, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ManagerStackParamList } from "../navigation/types";
import { sendMessage } from "../services/ai";
import { colors } from "../theme/colors";

export type ManagerAIAssistantContentProps = { listingId?: string; bookingId?: string };

type NavProps = NativeStackScreenProps<ManagerStackParamList, "AIAssistant">;

type ChatRow = { id: string; role: "user" | "assistant"; text: string };

export function ManagerAIAssistantContent({ listingId, bookingId }: ManagerAIAssistantContentProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatRow[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Ask about stays, bookings, or how to use LECIPM Manager. Signed-in users get full manager context.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const onSend = useCallback(async () => {
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    setLoading(true);
    const uid = `u-${Date.now()}`;
    setMessages((m) => [...m, { id: uid, role: "user", text: t }]);
    try {
      const out = await sendMessage(t, { conversationId, listingId, bookingId });
      if (out.conversationId) setConversationId(out.conversationId);
      setMessages((m) => [
        ...m,
        { id: `a-${uid}`, role: "assistant", text: out.reply || "(No reply)" },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setMessages((m) => [...m, { id: `e-${uid}`, role: "assistant", text: msg }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, conversationId]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 12 }]}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubbleWrap,
              item.role === "user" ? styles.bubbleWrapUser : styles.bubbleWrapAssistant,
            ]}
          >
            <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}>
              <Text style={[styles.bubbleText, item.role === "user" && styles.bubbleTextUser]}>{item.text}</Text>
            </View>
          </View>
        )}
      />
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          placeholder="Message…"
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={4000}
          editable={!loading}
        />
        <Pressable
          style={({ pressed }) => [styles.sendBtn, (pressed || loading) && styles.sendBtnDim]}
          onPress={() => void onSend()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0b0b0b" size="small" />
          ) : (
            <Text style={styles.sendBtnText}>Send</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1 },
  listContent: { padding: 16, paddingTop: 8 },
  bubbleWrap: { marginBottom: 10, maxWidth: "100%" },
  bubbleWrapUser: { alignSelf: "flex-end" },
  bubbleWrapAssistant: { alignSelf: "flex-start" },
  bubble: {
    maxWidth: "92%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: colors.text, fontSize: 16, lineHeight: 22 },
  bubbleTextUser: { color: "#0b0b0b" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 16,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 72,
    alignItems: "center",
  },
  sendBtnDim: { opacity: 0.75 },
  sendBtnText: { color: "#0b0b0b", fontWeight: "700", fontSize: 15 },
});

export function AIAssistantScreen({ route }: NavProps) {
  const p = route.params ?? {};
  return <ManagerAIAssistantContent listingId={p.listingId} bookingId={p.bookingId} />;
}
