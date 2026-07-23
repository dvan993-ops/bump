import { SafeAreaView, StyleSheet, Text } from 'react-native';

export default function CreateScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.heading}>Create</Text>
      <Text style={styles.description}>
        Upload a beat, demo or open verse.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },

  description: {
    color: '#A7A7A7',
    fontSize: 16,
    marginTop: 10,
  },
});