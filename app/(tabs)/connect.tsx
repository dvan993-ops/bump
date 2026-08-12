import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const COLORS = {
  black: "#121212",
  card: "#1A1A1A",
  green: "#6fffb7",
  grey: "#A7A7A7",
  border: "#282828",
  white: "#FFFFFF",
};

type Rank = "Underground" | "Rising" | "Elite Producer" | "Worldwide";

type Attachment = {
  kind: "Beat" | "Verse";
  title: string;
};

type Conversation = {
  id: string;
  name: string;
  handle: string;
  rank: Rank;
  lastMessage: string;
  attachment?: Attachment;
  time: string;
  unread: boolean;
};

type CollabRequest = {
  id: string;
  name: string;
  handle: string;
  rank: Rank;
  note: string;
  attachment: Attachment;
};

const CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "kydvibes",
    handle: "@kydvibes",
    rank: "Elite Producer",
    lastMessage: "Sent a beat — Midnight Drive",
    attachment: { kind: "Beat", title: "Midnight Drive" },
    time: "2m",
    unread: true,
  },
  {
    id: "2",
    name: "nox.wav",
    handle: "@nox.wav",
    rank: "Rising",
    lastMessage: "That switch at 0:45 is crazy, sending my verse now",
    attachment: { kind: "Verse", title: "Cold Summer (Verse)" },
    time: "38m",
    unread: true,
  },
  {
    id: "3",
    name: "prodbyocean",
    handle: "@prodbyocean",
    rank: "Worldwide",
    lastMessage: "Yeah let's link up on the R&B one",
    time: "1h",
    unread: false,
  },
  {
    id: "4",
    name: "beatsbykairo",
    handle: "@beatsbykairo",
    rank: "Underground",
    lastMessage: "Appreciate the feedback",
    time: "Yesterday",
    unread: false,
  },
];

const REQUESTS: CollabRequest[] = [
  {
    id: "1",
    name: "glasswave",
    handle: "@glasswave",
    rank: "Rising",
    note: "wants to collab on Pressure",
    attachment: { kind: "Beat", title: "Pressure (Remix Stems)" },
  },
  {
    id: "2",
    name: "mvrley",
    handle: "@mvrley",
    rank: "Underground",
    note: "sent a freestyle over your beat",
    attachment: { kind: "Verse", title: "16 Bars (Neon Dreams)" },
  },
];

type ConnectTab = "messages" | "requests";

function comingSoon(feature: string) {
  Alert.alert(
    "Coming soon",
    `${feature} will be available once the Connect backend is live.`,
  );
}

export default function ConnectScreen() {
  const [tab, setTab] = useState<ConnectTab>("messages");

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Connect</Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => comingSoon("Starting new collabs")}
        >
          <Ionicons name="create-outline" size={24} color={COLORS.green} />
        </Pressable>
      </View>

      <Pressable style={styles.searchBar} onPress={() => comingSoon("Search")}>
        <Ionicons name="search" size={18} color={COLORS.grey} />
        <TextInput
          placeholder="Search producers and artists"
          placeholderTextColor={COLORS.grey}
          style={styles.searchInput}
          editable={false}
          pointerEvents="none"
        />
      </Pressable>

      <View style={styles.tabRow}>
        <SegmentButton
          label="Messages"
          active={tab === "messages"}
          onPress={() => setTab("messages")}
        />
        <SegmentButton
          label="Requests"
          count={REQUESTS.length}
          active={tab === "requests"}
          onPress={() => setTab("requests")}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tab === "messages" ? (
          CONVERSATIONS.map((item) => (
            <ConversationRow key={item.id} conversation={item} />
          ))
        ) : REQUESTS.length > 0 ? (
          REQUESTS.map((item) => <RequestCard key={item.id} request={item} />)
        ) : (
          <EmptyState
            icon="people-outline"
            title="No requests yet"
            text="Collab requests from other artists will show up here."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SegmentButton({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.segment, active && styles.segmentActive]}
      onPress={onPress}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
        {label}
      </Text>
      {!!count && (
        <View style={styles.segmentBadge}>
          <Text style={styles.segmentBadgeText}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

function Avatar({ name, rank }: { name: string; rank: Rank }) {
  return (
    <View
      style={[
        styles.avatar,
        rank === "Underground" && styles.avatarUnderground,
      ]}
    >
      <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

function RankBadge({ rank }: { rank: Rank }) {
  return (
    <View style={styles.rankBadge}>
      <Ionicons name="trophy" size={10} color={COLORS.green} />
      <Text style={styles.rankBadgeText}>{rank}</Text>
    </View>
  );
}

function AttachmentPill({ attachment }: { attachment: Attachment }) {
  return (
    <View style={styles.attachmentPill}>
      <Ionicons
        name={attachment.kind === "Beat" ? "musical-notes" : "mic"}
        size={12}
        color={COLORS.green}
      />
      <Text style={styles.attachmentPillText} numberOfLines={1}>
        {attachment.title}
      </Text>
    </View>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => comingSoon("Chat")}
    >
      <Avatar name={conversation.name} rank={conversation.rank} />

      <View style={styles.rowBody}>
        <View style={styles.rowTopLine}>
          <Text style={styles.rowName}>{conversation.handle}</Text>
          <Text style={styles.rowTime}>{conversation.time}</Text>
        </View>

        <RankBadge rank={conversation.rank} />

        <Text
          style={[styles.rowMessage, conversation.unread && styles.rowMessageUnread]}
          numberOfLines={1}
        >
          {conversation.lastMessage}
        </Text>

        {conversation.attachment && (
          <AttachmentPill attachment={conversation.attachment} />
        )}
      </View>

      {conversation.unread && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

function RequestCard({ request }: { request: CollabRequest }) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.row}>
        <Avatar name={request.name} rank={request.rank} />

        <View style={styles.rowBody}>
          <Text style={styles.rowName}>{request.handle}</Text>
          <RankBadge rank={request.rank} />
          <Text style={styles.rowMessage}>{request.note}</Text>
          <AttachmentPill attachment={request.attachment} />
        </View>
      </View>

      <View style={styles.requestActions}>
        <Pressable
          style={styles.declineButton}
          onPress={() => comingSoon("Declining requests")}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </Pressable>
        <Pressable
          style={styles.acceptButton}
          onPress={() => comingSoon("Accepting requests")}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={40} color={COLORS.grey} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.black,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heading: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: "800",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 42,
    marginTop: 18,
  },

  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
  },

  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },

  segment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  segmentActive: {
    backgroundColor: "rgba(111,255,183,0.14)",
    borderColor: COLORS.green,
  },

  segmentText: {
    color: COLORS.grey,
    fontSize: 13,
    fontWeight: "700",
  },

  segmentTextActive: {
    color: COLORS.green,
  },

  segmentBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.green,
  },

  segmentBadgeText: {
    color: COLORS.black,
    fontSize: 11,
    fontWeight: "800",
  },

  scrollContent: {
    paddingTop: 18,
    paddingBottom: 40,
    gap: 10,
  },

  row: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2B24",
    borderWidth: 2,
    borderColor: COLORS.green,
    marginRight: 12,
  },

  avatarUnderground: {
    borderColor: COLORS.grey,
  },

  avatarText: {
    color: COLORS.green,
    fontSize: 18,
    fontWeight: "800",
  },

  rowBody: {
    flex: 1,
    gap: 4,
  },

  rowTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },

  rowTime: {
    color: COLORS.grey,
    fontSize: 12,
  },

  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: "rgba(111,255,183,0.12)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  rankBadgeText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  rowMessage: {
    color: COLORS.grey,
    fontSize: 13,
  },

  rowMessageUnread: {
    color: COLORS.white,
    fontWeight: "600",
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.green,
    marginLeft: 8,
    marginTop: 4,
  },

  attachmentPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: "#1F2B24",
    borderWidth: 1,
    borderColor: "rgba(111,255,183,0.35)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
    maxWidth: "100%",
  },

  attachmentPillText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "700",
  },

  requestCard: {
    backgroundColor: "transparent",
  },

  requestActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  declineButton: {
    flex: 1,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },

  declineButtonText: {
    color: COLORS.grey,
    fontSize: 13,
    fontWeight: "700",
  },

  acceptButton: {
    flex: 1,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: COLORS.green,
  },

  acceptButtonText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: "800",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 8,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
  },

  emptyText: {
    color: COLORS.grey,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 30,
  },
});
