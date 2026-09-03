import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../context/ThemeContext';

type WelcomeScreenProps = {
  onContinue: () => void;
};

const FEATURES = [
  { icon: 'calendar-outline' as const, text: 'Acompanhe a liturgia diária' },
  { icon: 'book-outline' as const, text: 'Leia a Bíblia mesmo sem internet' },
  { icon: 'document-text-outline' as const, text: 'Guarde notas e reflexões' },
];

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.mark, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image
            accessibilityLabel="Ícone do Veritas"
            source={require('../../Icon.png')}
            style={styles.appIcon}
          />
        </View>

        <Text style={[styles.eyebrow, { color: colors.mutedText }]}>BEM-VINDO AO</Text>
        <Text style={[styles.brand, { color: colors.primary }]}>veritas</Text>
        <Text style={[styles.introduction, { color: colors.text }]}>
          Palavra, oração e reflexão para acompanhar sua caminhada de fé todos os dias.
        </Text>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.text} style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name={feature.icon} size={21} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>{feature.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Começar a usar o Veritas"
          onPress={onContinue}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>Começar</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.background} />
        </Pressable>
        <Text style={[styles.footerText, { color: colors.mutedText }]}>Tudo o que você precisa, disponível também offline.</Text>
        <Text style={[styles.supportText, { color: colors.mutedText }]}>Se o Veritas fizer bem à sua caminhada, considere apoiar o projeto.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  mark: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  appIcon: { width: '100%', height: '100%' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2.4, textAlign: 'center' },
  brand: { marginTop: 4, fontFamily: 'serif', fontSize: 52, fontWeight: '700', textAlign: 'center' },
  introduction: { marginTop: 14, fontSize: 17, lineHeight: 26, textAlign: 'center' },
  features: { marginTop: 36, gap: 15 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  featureText: { flex: 1, fontSize: 15, fontWeight: '600' },
  footer: { paddingHorizontal: 24, paddingBottom: 18 },
  button: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
  },
  buttonText: { fontSize: 17, fontWeight: '800' },
  footerText: { marginTop: 13, fontSize: 11, textAlign: 'center' },
  supportText: { marginTop: 6, fontSize: 10, lineHeight: 14, textAlign: 'center' },
});
