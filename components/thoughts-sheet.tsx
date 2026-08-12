import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const COLORS = {
  black: "#000000",
  charcoal: "#121212",
  surface: "#1A1A1A",
  raised: "#242424",
  green: "#1DB954",
  white: "#FFFFFF",
  grey: "#B3B3B3",
  muted: "#777777",
  border: "rgba(0,0,0,1)",
};

export type Thought = {
  id: string;
  user: string;
  text: string;
  minutesAgo: number;
};

type ThoughtsSheetProps = {
  visible: boolean;
  beatTitle: string;
  thoughts: Thought[];
  onClose: () => void;
  onSubmit: (text: string) => void;
};

/**
 * Formats a number of elapsed minutes into a short relative time label.
 * Example: 47 minutes becomes "47m" and 200 minutes becomes "3h".
 */
function formatTimeAgo(minutesAgo: number): string {
  if (minutesAgo < 60) {
    return `${minutesAgo}m`;
  }

  const hours = Math.floor(minutesAgo / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  return `${Math.floor(hours / 24)}d`;
}

/**
 * Displays the bottom-sheet "Thoughts" panel for a beat.
 * Thoughts are feedback, opinions, and reactions from other users about the song/beat,
 * distinct from a plain comment thread.
 */
export function ThoughtsSheet({
  visible,
  beatTitle,
  thoughts,
  onClose,
  onSubmit,
}: ThoughtsSheetProps) {
  const [draftText, setDraftText] = useState("");

  const submitDraft = () => {
    const trimmed = draftText.trim();

    if (trimmed.length === 0) {
      return;
    }

    onSubmit(trimmed);
    setDraftText("");
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Thoughts</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                What people think of &ldquo;{beatTitle}&rdquo;
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={25} color={COLORS.white} />
            </Pressable>
          </View>

          {thoughts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={34}
                color={COLORS.grey}
              />
              <Text style={styles.emptyStateText}>
                No thoughts yet. Be the first to share what you think about this
                beat.
              </Text>
            </View>
          ) : (
            <FlatList
              data={thoughts}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.user.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.body}>
                    <View style={styles.metaRow}>
                      <Text style={styles.user}>{item.user}</Text>
                      <Text style={styles.time}>
                        {formatTimeAgo(item.minutesAgo)}
                      </Text>
                    </View>
                    <Text style={styles.text}>{item.text}</Text>
                  </View>
                </View>
              )}
            />
          )}

          <View style={styles.inputRow}>
            <TextInput
              value={draftText}
              onChangeText={setDraftText}
              placeholder="Share your thoughts on this beat..."
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              multiline
              maxLength={280}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Post thought"
              onPress={submitDraft}
              disabled={draftText.trim().length === 0}
              style={[
                styles.sendButton,
                draftText.trim().length === 0 && styles.sendButtonDisabled,
              ]}
            >
              <Ionicons name="arrow-up" size={20} color={COLORS.black} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.68)",
  },
  sheet: {
    height: "72%",
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: COLORS.charcoal,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    marginBottom: 16,
    backgroundColor: COLORS.muted,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.grey,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
    maxWidth: 250,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.raised,
  },
  list: {
    flex: 1,
    marginTop: 18,
  },
  listContent: {
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    marginBottom: 18,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.raised,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "800",
  },
  body: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  user: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  time: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  text: {
    color: COLORS.grey,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyStateText: {
    color: COLORS.grey,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.white,
    fontSize: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.green,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.muted,
    opacity: 0.5,
  },
});
