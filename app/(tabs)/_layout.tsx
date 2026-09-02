import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomTabBar } from '@/components/custom-tab-bar';
import { TabFocusProvider } from '@/components/tab-focus';

import ConnectScreen from './connect';
import CreateScreen from './create';
import HomeScreen from './index';
import MatchScreen from './match';
import ProfileScreen from './profile';

const COLORS = {
  black: '#121212',
};

/**
 * Order must match `TAB_INDEX` in `components/tab-focus.tsx` and the order of
 * `TABS` in the tab bar.
 */
const PAGES = [
  { key: 'index', Screen: HomeScreen },
  { key: 'match', Screen: MatchScreen },
  { key: 'create', Screen: CreateScreen },
  { key: 'connect', Screen: ConnectScreen },
  { key: 'profile', Screen: ProfileScreen },
];

/**
 * Tabs are a stack of screens, not a pager.
 *
 * This used to be a PagerView. Horizontal drags belong to the cards in Match —
 * swiping to Bump and swiping between tabs cannot share the same gesture — and
 * once swiping between tabs is gone, a pager is nothing but a gesture surface
 * that competes with the one we want. So every screen is laid out on top of the
 * others and only the active one is visible and interactive.
 *
 * All five stay mounted, exactly as they did under the pager, so screen state
 * and audio players survive a tab change. Screens that own audio must still
 * gate playback on `useIsTabFocused`.
 */
export default function TabLayout() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <TabFocusProvider index={activeIndex}>
      <View style={styles.pages}>
        {PAGES.map(({ key, Screen }, index) => {
          const current = index === activeIndex;

          return (
            <View
              key={key}
              // Hidden pages stay laid out rather than being display:none, so
              // they keep their measured height and are ready the instant you
              // switch to them.
              style={[styles.page, current ? styles.visible : styles.hidden]}
              pointerEvents={current ? 'auto' : 'none'}
            >
              <Screen />
            </View>
          );
        })}
      </View>

      <CustomTabBar activeIndex={activeIndex} onTabPress={setActiveIndex} />
    </TabFocusProvider>
  );
}

const styles = StyleSheet.create({
  pages: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  page: {
    ...StyleSheet.absoluteFillObject,
  },

  visible: {
    opacity: 1,
    zIndex: 1,
  },

  hidden: {
    opacity: 0,
    zIndex: 0,
  },
});
