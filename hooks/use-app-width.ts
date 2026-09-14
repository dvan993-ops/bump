import { useWindowDimensions } from 'react-native';

import { MAX_APP_WIDTH } from '@/constants/layout';

/**
 * Layout math that assumes "screen width" breaks once the app is centred in
 * a phone-width column on wide web viewports — the browser window is wider
 * than the column the app actually renders in. Use this instead of
 * `useWindowDimensions().width` for any such calculation.
 */
export function useAppWidth(): number {
  const { width } = useWindowDimensions();
  return Math.min(width, MAX_APP_WIDTH);
}
