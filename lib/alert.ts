import { useSyncExternalStore } from 'react';

/**
 * `Alert.alert` from 'react-native' is a no-op on web (react-native-web ships
 * an empty stub), so every "coming soon" placeholder and the delete
 * confirmation silently did nothing there. This is a drop-in replacement —
 * same call signature — backed by a small store and `<AlertHost />`
 * (mounted once in `app/_layout.tsx`), so it renders on every platform.
 */

export type AlertButton = {
  text?: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type AlertState = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
};

const DEFAULT_BUTTONS: AlertButton[] = [{ text: 'OK' }];

let state: AlertState = { visible: false, title: '', buttons: DEFAULT_BUTTONS };
const listeners = new Set<() => void>();

function setState(next: AlertState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function alert(title: string, message?: string, buttons: AlertButton[] = DEFAULT_BUTTONS): void {
  setState({ visible: true, title, message, buttons });
}

export const Alert = { alert };

export function dismissAlert(): void {
  setState({ ...state, visible: false });
}

export function useAlertState(): AlertState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}
