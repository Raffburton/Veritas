import { StyleSheet, View } from 'react-native';

import { AccessibleText as Text } from '../components/AccessibleText';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Veritas</Text>
      <Text style={styles.subtitle}>Projeto configurado e pronto para começar.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 8,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#475569',
    fontSize: 16,
    textAlign: 'center',
  },
});
