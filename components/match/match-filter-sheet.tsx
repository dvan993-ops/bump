/**
 * Discovery filters for Match: role, genre, location, what they are looking
 * for, and whether to show only Open Collabs. Everything is applied on top of
 * the ranking rather than replacing it, so the order still reflects fit.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { BumpColors } from '@/constants/bump-theme';
import {
  GENRES,
  LOOKING_FOR,
  ROLES,
  type Genre,
  type LookingFor,
  type Role,
} from '@/constants/match-data';
import {
  DEFAULT_FILTERS,
  DISTANCE_OPTIONS,
  type MatchFilters,
} from '@/lib/match-discovery';

export type MatchFilterSheetProps = {
  visible: boolean;
  filters: MatchFilters;
  /** How many artists the draft filters would leave in the feed. */
  resultCount: (draft: MatchFilters) => number;
  onClose: () => void;
  onApply: (filters: MatchFilters) => void;
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((entry) => entry !== value)
    : [...list, value];
}

export function MatchFilterSheet({
  visible,
  filters,
  resultCount,
  onClose,
  onApply,
}: MatchFilterSheetProps) {
  const [draft, setDraft] = useState<MatchFilters>(filters);

  // Re-sync whenever the sheet is opened, so a cancelled edit is discarded.
  useEffect(() => {
    if (visible) {
      setDraft(filters);
    }
  }, [visible, filters]);

  const count = resultCount(draft);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Who are you looking for?</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              onPress={onClose}
              style={styles.close}
            >
              <Ionicons name="close" size={24} color={BumpColors.white} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <Text style={styles.label}>Role</Text>
            <View style={styles.wrap}>
              {ROLES.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  selected={draft.roles.includes(role)}
                  onPress={() =>
                    setDraft((current) => ({
                      ...current,
                      roles: toggle<Role>(current.roles, role),
                    }))
                  }
                />
              ))}
            </View>

            <Text style={styles.label}>Genre</Text>
            <View style={styles.wrap}>
              {GENRES.map((genre) => (
                <Chip
                  key={genre}
                  label={genre}
                  selected={draft.genres.includes(genre)}
                  onPress={() =>
                    setDraft((current) => ({
                      ...current,
                      genres: toggle<Genre>(current.genres, genre),
                    }))
                  }
                />
              ))}
            </View>

            <Text style={styles.label}>Location</Text>
            <View style={styles.wrap}>
              {DISTANCE_OPTIONS.map((option) => (
                <Chip
                  key={option.label}
                  label={option.label}
                  selected={draft.maxDistanceKm === option.km}
                  onPress={() =>
                    setDraft((current) => ({
                      ...current,
                      maxDistanceKm: option.km,
                    }))
                  }
                />
              ))}
            </View>

            <Text style={styles.label}>They are looking for</Text>
            <View style={styles.wrap}>
              {LOOKING_FOR.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  selected={draft.lookingFor.includes(tag)}
                  onPress={() =>
                    setDraft((current) => ({
                      ...current,
                      lookingFor: toggle<LookingFor>(current.lookingFor, tag),
                    }))
                  }
                />
              ))}
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={styles.switchLabel}>Open collabs only</Text>
                <Text style={styles.switchHint}>
                  Posts with a specific ask you can answer right now
                </Text>
              </View>

              <Switch
                value={draft.openCollabsOnly}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    openCollabsOnly: value,
                  }))
                }
                trackColor={{
                  false: BumpColors.raised,
                  true: BumpColors.mintWash,
                }}
                thumbColor={
                  draft.openCollabsOnly ? BumpColors.mint : BumpColors.muted
                }
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDraft(DEFAULT_FILTERS)}
              style={styles.reset}
            >
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={count === 0}
              onPress={() => onApply(draft)}
              style={({ pressed }) => [
                styles.apply,
                pressed && styles.applyPressed,
                count === 0 && styles.applyDisabled,
              ]}
            >
              <Text style={styles.applyText}>
                {count === 0
                  ? 'No artists match'
                  : `Show ${count} ${count === 1 ? 'artist' : 'artists'}`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },

  sheet: {
    maxHeight: '86%',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: BumpColors.charcoal,
  },

  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    marginBottom: 14,
    backgroundColor: BumpColors.muted,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  title: {
    flex: 1,
    color: BumpColors.white,
    fontSize: 23,
    fontWeight: '900',
  },

  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BumpColors.raised,
  },

  scroll: {
    paddingBottom: 14,
  },

  label: {
    color: BumpColors.grey,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 22,
    marginBottom: 10,
  },

  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: BumpColors.raised,
    borderWidth: 1,
    borderColor: BumpColors.border,
  },

  chipSelected: {
    backgroundColor: BumpColors.mint,
    borderColor: BumpColors.mint,
  },

  chipText: {
    color: BumpColors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  chipTextSelected: {
    color: BumpColors.black,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 24,
    padding: 14,
    borderRadius: 16,
    backgroundColor: BumpColors.surface,
    borderWidth: 1,
    borderColor: BumpColors.border,
  },

  switchText: {
    flex: 1,
  },

  switchLabel: {
    color: BumpColors.white,
    fontSize: 15,
    fontWeight: '800',
  },

  switchHint: {
    color: BumpColors.grey,
    fontSize: 12,
    marginTop: 2,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },

  reset: {
    height: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: BumpColors.border,
    backgroundColor: BumpColors.surface,
  },

  resetText: {
    color: BumpColors.grey,
    fontSize: 14,
    fontWeight: '700',
  },

  apply: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: BumpColors.mint,
  },

  applyPressed: {
    backgroundColor: BumpColors.mintPressed,
    transform: [{ scale: 0.985 }],
  },

  applyDisabled: {
    backgroundColor: BumpColors.raised,
  },

  applyText: {
    color: BumpColors.black,
    fontSize: 15,
    fontWeight: '900',
  },
});
