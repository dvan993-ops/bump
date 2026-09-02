/**
 * Which tab is on screen.
 *
 * The tab bar is a PagerView, so all five screens are mounted at once and none
 * of them unmount when you swipe away. Without this, Home's preview keeps
 * playing while you are looking at Match and you hear two tracks at once.
 * Screens that own audio should gate playback on `useIsTabFocused`.
 */

import { createContext, useContext, type ReactNode } from 'react';

const TabFocusContext = createContext(0);

export type TabFocusProviderProps = {
  /** Index of the page currently shown by the pager. */
  index: number;
  children: ReactNode;
};

export function TabFocusProvider({ index, children }: TabFocusProviderProps) {
  return (
    <TabFocusContext.Provider value={index}>
      {children}
    </TabFocusContext.Provider>
  );
}

/** True when the given tab index is the one on screen. */
export function useIsTabFocused(index: number): boolean {
  return useContext(TabFocusContext) === index;
}

/** Tab indexes, matching the order of the pages in `app/(tabs)/_layout.tsx`. */
export const TAB_INDEX = {
  home: 0,
  match: 1,
  create: 2,
  connect: 3,
  profile: 4,
} as const;
