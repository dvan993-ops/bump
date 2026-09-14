import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BumpColors } from '@/constants/bump-theme';
import { TRACK_TYPES, type Track, type TrackType } from '@/constants/profile-data';
import { useAppWidth } from '@/hooks/use-app-width';
import { Alert } from '@/lib/alert';

import { TrackCover } from './track-cover';
import { TITLE_CLEARANCE } from './track-tile';

const COLORS = {
  black: BumpColors.charcoal,
  surface: BumpColors.surface,
  border: BumpColors.border,
  white: BumpColors.white,
  grey: BumpColors.grey,
  muted: BumpColors.muted,
  /** Same red as a Match skip; used here only for Delete. */
  danger: BumpColors.skip,
};

const TITLE_MAX = 60;
const CAPTION_MAX = 150;
const BPM_MIN = 40;
const BPM_MAX = 300;

type Props = {
  visible: boolean;
  /** Bump this each time the sheet opens so the draft resets. */
  sessionKey: number;
  track: Track | null;
  onClose: () => void;
  onSave: (track: Track) => void;
  onDelete: (track: Track) => void;
};

/**
 * Full-height sheet for editing one upload. Slides up over the tab pager, so
 * nothing underneath can be swiped to while it's open.
 *
 * The form remounts on every open (via `sessionKey`), so it always starts from
 * the saved track and Cancel, or a swipe down on iOS, just drops the draft.
 */
export function EditTrackSheet({
  visible,
  sessionKey,
  track,
  onClose,
  onSave,
  onDelete,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {track && (
        <EditTrackForm
          key={sessionKey}
          track={track}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </Modal>
  );
}

type FormProps = Omit<Props, 'visible' | 'sessionKey' | 'track'> & { track: Track };

function EditTrackForm({ track, onClose, onSave, onDelete }: FormProps) {
  const insets = useSafeAreaInsets();
  const width = useAppWidth();

  const [coverUri, setCoverUri] = useState(track.coverUri);
  const [title, setTitle] = useState(track.title);
  const [type, setType] = useState<TrackType>(track.type);
  const [genre, setGenre] = useState(track.genre);
  const [bpm, setBpm] = useState(track.bpm ? String(track.bpm) : '');
  const [musicalKey, setMusicalKey] = useState(track.musicalKey);
  const [caption, setCaption] = useState(track.caption);
  const [pinned, setPinned] = useState(track.pinned);

  const bpmNumber = bpm === '' ? null : Number(bpm);
  const bpmInvalid =
    bpmNumber !== null && (bpmNumber < BPM_MIN || bpmNumber > BPM_MAX);
  const canSave = title.trim().length > 0 && !bpmInvalid;

  const coverSize = Math.min(width - 96, 240);
  // iOS page sheets already sit below the status bar; Android modals don't.
  const topPadding = Platform.OS === 'ios' ? 0 : insets.top;

  async function pickCover() {
    try {
      // No permission prompt is needed to open the system photo picker.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      const asset = result.canceled ? undefined : result.assets[0];
      if (asset) {
        setCoverUri(asset.uri);
      }
    } catch {
      Alert.alert(
        "Couldn't open your photos",
        'Check that Bump can access your photo library in Settings, then try again.',
      );
    }
  }

  function save() {
    if (!canSave) {
      return;
    }

    onSave({
      ...track,
      coverUri,
      title: title.trim(),
      type,
      genre: genre.trim(),
      bpm: bpmNumber,
      musicalKey: musicalKey.trim(),
      caption: caption.trim(),
      pinned,
    });
  }

  function confirmDelete() {
    Alert.alert(
      `Delete "${track.title}"?`,
      'It will be removed from your profile and from Match.',
      [
        { text: 'Keep track', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(track) },
      ],
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: topPadding }]}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.topTitle}>Edit track</Text>
        <Pressable
          onPress={save}
          disabled={!canSave}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
        >
          <Text style={[styles.save, !canSave && styles.saveDisabled]}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: 32 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* Cover */}
          <View style={styles.coverBlock}>
            <Pressable
              onPress={pickCover}
              accessibilityRole="button"
              accessibilityLabel={coverUri ? 'Change cover image' : 'Upload cover image'}
              style={({ pressed }) => [
                styles.coverFrame,
                { width: coverSize, height: coverSize },
                pressed && styles.pressed,
              ]}
            >
              {/* Same clearance as the grid tile, so the preview matches the grid. */}
              <TrackCover
                track={{ id: track.id, title, coverUri }}
                size={coverSize}
                bottomClearance={coverSize * TITLE_CLEARANCE}
              />
            </Pressable>

            <View style={styles.coverActions}>
              <Pressable onPress={pickCover} hitSlop={8} accessibilityRole="button">
                <Text style={styles.coverAction}>
                  {coverUri ? 'Change cover' : 'Upload cover'}
                </Text>
              </Pressable>
              {coverUri && (
                <Pressable
                  onPress={() => setCoverUri(null)}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Text style={styles.coverActionQuiet}>Remove</Text>
                </Pressable>
              )}
            </View>
            {!coverUri && (
              <Text style={styles.hint}>
                Square images look best. You can crop after choosing.
              </Text>
            )}
          </View>

          {/* Title */}
          <Field label="Title" count={`${title.length}/${TITLE_MAX}`}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              maxLength={TITLE_MAX}
              placeholder="Name your track"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              returnKeyType="done"
            />
          </Field>

          {/* Type */}
          <Field label="Type">
            <View style={styles.segment}>
              {TRACK_TYPES.map((option) => {
                const selected = option === type;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setType(option)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[styles.segmentItem, selected && styles.segmentItemActive]}
                  >
                    <Text
                      style={[styles.segmentText, selected && styles.segmentTextActive]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          {/* Genre */}
          <Field label="Genre">
            <TextInput
              value={genre}
              onChangeText={setGenre}
              placeholder="Lo-Fi, Drill, R&B…"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              maxLength={30}
            />
          </Field>

          {/* BPM + key */}
          <View style={styles.row}>
            <View style={styles.flex}>
              <Field label="BPM">
                <TextInput
                  value={bpm}
                  onChangeText={(text) => setBpm(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholder="90"
                  placeholderTextColor={COLORS.muted}
                  style={[styles.input, bpmInvalid && styles.inputError]}
                />
              </Field>
            </View>
            <View style={styles.flex}>
              <Field label="Key">
                <TextInput
                  value={musicalKey}
                  onChangeText={setMusicalKey}
                  placeholder="A Minor"
                  placeholderTextColor={COLORS.muted}
                  style={styles.input}
                  maxLength={12}
                />
              </Field>
            </View>
          </View>
          {bpmInvalid && (
            <Text style={styles.error}>
              BPM needs to be between {BPM_MIN} and {BPM_MAX}.
            </Text>
          )}

          {/* Caption */}
          <Field label="Caption" count={`${caption.length}/${CAPTION_MAX}`}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              maxLength={CAPTION_MAX}
              multiline
              placeholder="What should artists know about this track?"
              placeholderTextColor={COLORS.muted}
              style={[styles.input, styles.inputMultiline]}
              textAlignVertical="top"
            />
          </Field>

          {/* Pin */}
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={styles.switchLabel}>Pin to top of profile</Text>
              <Text style={styles.hint}>Pinned tracks show first in your grid.</Text>
            </View>
            <Switch
              value={pinned}
              onValueChange={setPinned}
              trackColor={{ false: COLORS.border, true: COLORS.white }}
              thumbColor={pinned ? COLORS.black : COLORS.grey}
              ios_backgroundColor={COLORS.border}
            />
          </View>

          <Pressable
            onPress={confirmDelete}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={styles.deleteText}>Delete track</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  count,
  children,
}: {
  label: string;
  count?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {count && <Text style={styles.fieldCount}>{count}</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  pressed: {
    opacity: 0.7,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },

  cancel: {
    color: COLORS.grey,
    fontSize: 16,
  },

  topTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  save: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  saveDisabled: {
    color: COLORS.muted,
  },

  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  coverBlock: {
    alignItems: 'center',
    marginBottom: 12,
  },

  coverFrame: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },

  coverActions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
  },

  coverAction: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },

  coverActionQuiet: {
    color: COLORS.grey,
    fontSize: 15,
  },

  hint: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  field: {
    marginTop: 18,
  },

  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  fieldLabel: {
    color: COLORS.grey,
    fontSize: 13,
    fontWeight: '600',
  },

  fieldCount: {
    color: COLORS.muted,
    fontSize: 12,
  },

  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    color: COLORS.white,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },

  inputMultiline: {
    minHeight: 92,
    paddingTop: 12,
  },

  inputError: {
    borderColor: COLORS.danger,
  },

  error: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 6,
  },

  row: {
    flexDirection: 'row',
    gap: 12,
  },

  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 3,
  },

  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 7,
  },

  segmentItemActive: {
    backgroundColor: COLORS.white,
  },

  segmentText: {
    color: COLORS.grey,
    fontSize: 14,
    fontWeight: '600',
  },

  segmentTextActive: {
    color: COLORS.black,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },

  switchLabel: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  deleteText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '600',
  },
});
