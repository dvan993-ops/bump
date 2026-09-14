import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { dismissAlert, useAlertState, type AlertButton } from '@/lib/alert';
import { BumpColors, BumpRadii } from '@/constants/bump-theme';

/** Renders whatever `Alert.alert` (from `@/lib/alert`) last asked for. Mount once, near the root. */
export function AlertHost() {
  const state = useAlertState();

  const handlePress = (button: AlertButton) => {
    dismissAlert();
    button.onPress?.();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={state.visible}
      onRequestClose={dismissAlert}
    >
      <Pressable style={styles.backdrop} onPress={dismissAlert}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{state.title}</Text>
          {state.message ? <Text style={styles.message}>{state.message}</Text> : null}

          <View style={styles.buttonRow}>
            {state.buttons.map((button, index) => (
              <Pressable
                key={`${button.text ?? 'OK'}-${index}`}
                style={styles.button}
                onPress={() => handlePress(button)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'destructive' && styles.destructiveText,
                    button.style === 'cancel' && styles.cancelText,
                  ]}
                >
                  {button.text ?? 'OK'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BumpColors.scrimHeavy,
    padding: 32,
  },

  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: BumpRadii.card,
    backgroundColor: BumpColors.raised,
    borderWidth: 1,
    borderColor: BumpColors.border,
    padding: 20,
  },

  title: {
    color: BumpColors.white,
    fontSize: 17,
    fontWeight: '700',
  },

  message: {
    color: BumpColors.grey,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 20,
  },

  button: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },

  buttonText: {
    color: BumpColors.mint,
    fontSize: 15,
    fontWeight: '600',
  },

  cancelText: {
    color: BumpColors.grey,
  },

  destructiveText: {
    color: BumpColors.skip,
  },
});
