import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AudioVisualizer } from '@/components/audio-visualizer';
import { StudioGlow } from '@/components/studio-glow';
import { BumpColors, BumpRadii } from '@/constants/bump-theme';
import { Alert } from '@/lib/alert';

type PostType = 'beat' | 'demo' | 'openVerse';

const POST_TYPES: {
  key: PostType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}[] = [
  {
    key: 'beat',
    icon: 'musical-notes-outline',
    title: 'Beat',
    desc: 'Instrumental looking for vocals',
  },
  {
    key: 'demo',
    icon: 'mic-outline',
    title: 'Demo',
    desc: 'A track in progress to showcase',
  },
  {
    key: 'openVerse',
    icon: 'chatbox-ellipses-outline',
    title: 'Open verse',
    desc: 'Leave space for a collab',
  },
];

/** Deterministic pseudo-random bar heights, so the preview looks like a waveform without a real file. */
function previewBars(count: number, seed = 7): number[] {
  const bars: number[] = [];
  let x = seed;

  for (let index = 0; index < count; index += 1) {
    x = (x * 9301 + 49297) % 233280;
    bars.push(10 + (x / 233280) * 120);
  }

  return bars;
}

export default function CreateScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [postType, setPostType] = useState<PostType>('beat');
  const bars = useMemo(() => previewBars(44), []);

  const chooseAudio = () => {
    setFileName('midnight-drive-master.wav');
  };

  const postToFeed = () => {
    if (!fileName) {
      Alert.alert('Choose audio first', 'Pick a file before posting to the feed.');
      return;
    }

    Alert.alert('Posted', 'Your track is live on the feed.');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StudioGlow />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Create</Text>
        <Text style={styles.subheading}>Upload a beat, demo or open verse.</Text>

        {/* Drop zone */}
        <Pressable onPress={chooseAudio} style={styles.dropZone}>
          <View style={styles.dropIcon}>
            <Ionicons name="cloud-upload-outline" size={28} color={BumpColors.mint} />
          </View>
          <Text style={styles.dropTitle}>
            {fileName ?? 'Drop a file or tap to browse'}
          </Text>
          <Text style={styles.dropHint}>MP3 or WAV · up to 60 MB</Text>
          <Pressable onPress={chooseAudio} style={styles.chooseButton}>
            <Text style={styles.chooseButtonText}>
              {fileName ? 'Change audio' : 'Choose audio'}
            </Text>
          </Pressable>
        </Pressable>

        {/* Snippet selector preview */}
        <View style={styles.snippetCard}>
          <View style={styles.snippetHeader}>
            <View style={styles.snippetLabel}>
              <Ionicons name="cut-outline" size={16} color={BumpColors.mint} />
              <Text style={styles.snippetLabelText}>Pick your 20s hook</Text>
            </View>
            <Text style={styles.snippetRange}>0:12 – 0:32</Text>
          </View>

          <View style={styles.waveformWrap}>
            <AudioVisualizer
              bars={bars}
              width={328}
              height={64}
              color={BumpColors.mint}
              gap={3}
              glowBlur={0}
            />
            <View pointerEvents="none" style={styles.selectionWindow} />
          </View>
        </View>

        {/* Post type */}
        <View style={styles.typeSection}>
          <Text style={styles.typeSectionLabel}>What are you posting?</Text>

          {POST_TYPES.map((type) => {
            const selected = postType === type.key;

            return (
              <Pressable
                key={type.key}
                onPress={() => setPostType(type.key)}
                style={[styles.typeCard, selected && styles.typeCardSelected]}
              >
                <View style={styles.typeIcon}>
                  <Ionicons name={type.icon} size={20} color={BumpColors.mint} />
                </View>
                <View style={styles.typeCopy}>
                  <Text style={styles.typeTitle}>{type.title}</Text>
                  <Text style={styles.typeDesc}>{type.desc}</Text>
                </View>
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'chevron-forward'}
                  size={selected ? 20 : 16}
                  color={selected ? BumpColors.mint : BumpColors.muted}
                />
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={postToFeed} style={styles.postButton}>
          <Ionicons name="sparkles-outline" size={16} color={BumpColors.black} />
          <Text style={styles.postButtonText}>Post to feed</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BumpColors.charcoal,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },

  heading: {
    color: BumpColors.white,
    fontSize: 30,
    fontWeight: '800',
  },

  subheading: {
    color: BumpColors.grey,
    fontSize: 14,
    marginTop: 4,
  },

  dropZone: {
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: BumpColors.mintEdge,
    backgroundColor: BumpColors.mintWash,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },

  dropIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(111,255,183,0.15)',
  },

  dropTitle: {
    color: BumpColors.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },

  dropHint: {
    color: BumpColors.grey,
    fontSize: 12,
  },

  chooseButton: {
    marginTop: 4,
    borderRadius: BumpRadii.pill,
    backgroundColor: BumpColors.mint,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },

  chooseButtonText: {
    color: BumpColors.black,
    fontSize: 13,
    fontWeight: '700',
  },

  snippetCard: {
    marginTop: 20,
    borderRadius: BumpRadii.card,
    borderWidth: 1,
    borderColor: BumpColors.border,
    backgroundColor: BumpColors.surface,
    padding: 16,
  },

  snippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  snippetLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  snippetLabelText: {
    color: BumpColors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  snippetRange: {
    color: BumpColors.mint,
    fontSize: 12,
  },

  waveformWrap: {
    position: 'relative',
  },

  selectionWindow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '28%',
    right: '38%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: BumpColors.mintEdge,
    backgroundColor: BumpColors.mintWash,
  },

  typeSection: {
    marginTop: 20,
    gap: 10,
  },

  typeSectionLabel: {
    color: BumpColors.grey,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: BumpRadii.card,
    borderWidth: 1,
    borderColor: BumpColors.border,
    backgroundColor: BumpColors.surface,
    padding: 14,
  },

  typeCardSelected: {
    borderColor: BumpColors.mintEdge,
    backgroundColor: BumpColors.mintWash,
  },

  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(111,255,183,0.12)',
  },

  typeCopy: {
    flex: 1,
  },

  typeTitle: {
    color: BumpColors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  typeDesc: {
    color: BumpColors.grey,
    fontSize: 12,
    marginTop: 1,
  },

  postButton: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: BumpRadii.pill,
    backgroundColor: BumpColors.mint,
    paddingVertical: 15,
  },

  postButtonText: {
    color: BumpColors.black,
    fontSize: 14,
    fontWeight: '800',
  },
});
