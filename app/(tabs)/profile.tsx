import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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

type UploadItem = {
  id: string;
  title: string;
  type: "Beat" | "Demo" | "Open Verse";
};

const MOCK_UPLOADS: UploadItem[] = [
  { id: "1", title: "Midnight Drive", type: "Beat" },
  { id: "2", title: "No Sleep (Demo)", type: "Demo" },
  { id: "3", title: "16 Bars Freestyle", type: "Open Verse" },
  { id: "4", title: "Glass City", type: "Beat" },
];

export default function ProfileScreen() {
  const [uploads] = useState<UploadItem[]>(MOCK_UPLOADS);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>Profile</Text>
          <Pressable hitSlop={10}>
            <Ionicons name="settings-outline" size={24} color={COLORS.grey} />
          </Pressable>
        </View>

        {/* Avatar + identity */}
        <View style={styles.identity}>
          <Image
            source={require("@/assets/images/RobloxScreenShot20260624_233539891.png")}
            style={styles.avatar}
          />
          <Text style={styles.name}>Sam Rivers</Text>
          <Text style={styles.role}>Producer • Auckland, NZ</Text>

          <Text style={styles.bio}>
            Making beats since 2019. Into lo-fi, boom bap and anything with a
            dusty sample. Always looking for vocalists to collab with.
          </Text>

          <Pressable style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBlock label="Uploads" value={uploads.length.toString()} />
          <View style={styles.statDivider} />
          <StatBlock label="Matches" value="18" />
          <View style={styles.statDivider} />
          <StatBlock label="Followers" value="212" />
        </View>

        {/* Genre tags */}
        <View style={styles.tagsRow}>
          {["Hip-Hop", "Lo-Fi", "R&B", "Boom Bap"].map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Uploads section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Your Uploads</Text>
          <Text style={styles.sectionAction}>See all</Text>
        </View>

        <View style={styles.uploadsList}>
          {uploads.map((item) => (
            <View key={item.id} style={styles.uploadCard}>
              <View style={styles.uploadIcon}>
                <Ionicons
                  name={
                    item.type === "Open Verse"
                      ? "mic-outline"
                      : "musical-notes-outline"
                  }
                  size={20}
                  color={COLORS.green}
                />
              </View>
              <View style={styles.uploadInfo}>
                <Text style={styles.uploadTitle}>{item.title}</Text>
                <Text style={styles.uploadType}>{item.type}</Text>
              </View>
              <Ionicons
                name="play-circle-outline"
                size={26}
                color={COLORS.grey}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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

  identity: {
    alignItems: "center",
    marginTop: 24,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: COLORS.green,
  },

  name: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 12,
  },

  role: {
    color: COLORS.grey,
    fontSize: 14,
    marginTop: 4,
  },

  bio: {
    color: COLORS.grey,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 10,
  },

  editButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 22,
  },

  editButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 24,
    paddingVertical: 16,
  },

  statBlock: {
    flex: 1,
    alignItems: "center",
  },

  statDivider: {
    width: 1,
    height: "60%",
    backgroundColor: COLORS.border,
  },

  statValue: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },

  statLabel: {
    color: COLORS.grey,
    fontSize: 12,
    marginTop: 2,
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
  },

  tag: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  tagText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "600",
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 12,
  },

  sectionHeader: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },

  sectionAction: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "600",
  },

  uploadsList: {
    gap: 10,
  },

  uploadCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
  },

  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#1F2B24",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  uploadInfo: {
    flex: 1,
  },

  uploadTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
  },

  uploadType: {
    color: COLORS.grey,
    fontSize: 12,
    marginTop: 2,
  },
});
