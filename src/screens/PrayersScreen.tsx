import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';

type Prayer = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  paragraphs: string[];
};

const PRAYERS: Prayer[] = [
  {
    id: 'pai-nosso',
    title: 'Pai-Nosso',
    description: 'A oração ensinada por Jesus',
    icon: 'sunny-outline',
    paragraphs: [
      'Pai nosso que estais nos céus, santificado seja o vosso nome; venha a nós o vosso reino, seja feita a vossa vontade, assim na terra como no céu.',
      'O pão nosso de cada dia nos dai hoje; perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido; e não nos deixeis cair em tentação, mas livrai-nos do mal.',
      'Amém.',
    ],
  },
  {
    id: 'protecao-sao-bento',
    title: 'Proteção de São Bento',
    description: 'Oração tradicional da Medalha de São Bento',
    icon: 'shield-checkmark-outline',
    paragraphs: [
      'A Cruz Sagrada seja minha luz. Não seja o dragão meu guia.',
      'Retira-te, Satanás! Nunca me aconselhes coisas vãs. É mau o que tu me ofereces; bebe tu mesmo os teus venenos!',
      'Amém.',
    ],
  },
  {
    id: 'ave-maria',
    title: 'Ave-Maria',
    description: 'Saudação e súplica à Mãe de Jesus',
    icon: 'rose-outline',
    paragraphs: [
      'Ave Maria, cheia de graça, o Senhor é convosco. Bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus.',
      'Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora da nossa morte.',
      'Amém.',
    ],
  },
  {
    id: 'gloria-ao-pai',
    title: 'Glória ao Pai',
    description: 'Louvor à Santíssima Trindade',
    icon: 'sparkles-outline',
    paragraphs: [
      'Glória ao Pai, ao Filho e ao Espírito Santo.',
      'Como era no princípio, agora e sempre.',
      'Amém.',
    ],
  },
];

export function PrayersScreen() {
  const { colors, fontSize } = useTheme();
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);

  function sharePrayer(prayer: Prayer) {
    return Share.share({
      message: [prayer.title, '', ...prayer.paragraphs, '', 'Compartilhado pelo Veritas'].join('\n'),
    });
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Orações</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>Um momento de encontro, confiança e devoção.</Text>

        {PRAYERS.map((prayer) => (
          <Pressable
            key={prayer.id}
            accessibilityRole="button"
            onPress={() => setSelectedPrayer(prayer)}
            style={({ pressed }) => [
              styles.prayerCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.prayerIcon, { backgroundColor: colors.background }]}>
              <Ionicons name={prayer.icon} size={23} color={colors.primary} />
            </View>
            <View style={styles.prayerText}>
              <Text style={[styles.prayerTitle, { color: colors.text }]}>{prayer.title}</Text>
              <Text style={[styles.prayerDescription, { color: colors.mutedText }]}>{prayer.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.mutedText} />
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={selectedPrayer !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPrayer(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setSelectedPrayer(null)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleArea}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>{selectedPrayer?.title}</Text>
                <Text style={[styles.sheetSubtitle, { color: colors.mutedText }]}>{selectedPrayer?.description}</Text>
              </View>
              <Pressable accessibilityLabel="Fechar oração" hitSlop={10} onPress={() => setSelectedPrayer(null)}>
                <Ionicons name="close" size={25} color={colors.mutedText} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.prayerContent} showsVerticalScrollIndicator={false}>
              <View style={[styles.largeIcon, { borderColor: colors.primary }]}>
                {selectedPrayer ? <Ionicons name={selectedPrayer.icon} size={31} color={colors.primary} /> : null}
              </View>
              {selectedPrayer?.paragraphs.map((paragraph, index) => (
                <Text
                  key={`${selectedPrayer.id}-${index}`}
                  style={[
                    styles.paragraph,
                    {
                      color: index === selectedPrayer.paragraphs.length - 1 ? colors.primary : colors.text,
                      fontSize,
                      lineHeight: Math.round(fontSize * 1.65),
                    },
                  ]}
                >
                  {paragraph}
                </Text>
              ))}
              {selectedPrayer ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void sharePrayer(selectedPrayer)}
                  style={[styles.shareButton, { borderColor: colors.border }]}
                >
                  <Ionicons name="share-social-outline" size={20} color={colors.primary} />
                  <Text style={[styles.shareText, { color: colors.text }]}>Compartilhar oração</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18, paddingBottom: 36 },
  title: { fontFamily: 'serif', fontSize: 28, fontWeight: '700' },
  subtitle: { marginTop: 5, marginBottom: 20, fontSize: 13, lineHeight: 19 },
  prayerCard: { flexDirection: 'row', alignItems: 'center', minHeight: 76, marginBottom: 10,
    paddingHorizontal: 14, borderWidth: 1, borderRadius: 14 },
  prayerIcon: { width: 45, height: 45, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderRadius: 13 },
  prayerText: { flex: 1 }, prayerTitle: { marginBottom: 4, fontFamily: 'serif', fontSize: 17, fontWeight: '700' },
  prayerDescription: { fontSize: 12 }, pressed: { opacity: 0.58 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.58)' },
  sheet: { maxHeight: '88%', paddingTop: 9, borderWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { alignSelf: 'center', width: 42, height: 4, marginBottom: 10, borderRadius: 2 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 15 },
  sheetTitleArea: { flex: 1 }, sheetTitle: { fontFamily: 'serif', fontSize: 23, fontWeight: '700' },
  sheetSubtitle: { marginTop: 3, fontSize: 12 }, prayerContent: { alignItems: 'center', padding: 22, paddingTop: 8, paddingBottom: 40 },
  largeIcon: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center', marginBottom: 18, borderWidth: 1, borderRadius: 31 },
  paragraph: { width: '100%', marginBottom: 14, fontFamily: 'serif', textAlign: 'center' },
  shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', minHeight: 48, marginTop: 10, borderWidth: 1, borderRadius: 11 },
  shareText: { fontSize: 13, fontWeight: '700' },
});
