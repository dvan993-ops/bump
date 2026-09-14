import { Platform, Share } from 'react-native';

import { Alert } from './alert';

/**
 * `Share.share` throws on web unless the browser implements
 * `navigator.share` (desktop Firefox, among others, doesn't). This wraps the
 * same call signature and falls back to copying the text to the clipboard,
 * which every browser supports.
 */
export async function shareOrCopy({
  message,
  url,
}: {
  message: string;
  url?: string;
}): Promise<void> {
  if (Platform.OS !== 'web') {
    await Share.share({ message, url });
    return;
  }

  const text = url ? `${message} ${url}` : message;

  if (typeof navigator !== 'undefined' && navigator.share) {
    await navigator.share({ text, url });
    return;
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    Alert.alert('Copied to clipboard', "Your browser can't open the share sheet, so we copied the link instead.");
    return;
  }

  throw new Error('Sharing is not supported in this browser.');
}
