import { StyleSheet, Text, View } from 'react-native';

export function AppScreen() {
  return (
    <View accessible accessibilityLabel="Hermes Mobile shell" style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Hermes Mobile
      </Text>
      <Text style={styles.subtitle}>The mobile shell is ready.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 16,
    marginTop: 8,
  },
});
