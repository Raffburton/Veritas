import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { toLocalIsoDate } from '../services/liturgicalCalendarService';
import { fetchVaticanSaint } from '../services/vaticanSaintService';

const VATICAN_SAINT_OF_THE_DAY_URL = 'https://www.vaticannews.va/pt/santo-do-dia.html';
const VATICAN_SAINT_CACHE_KEY = '@veritas:vatican-saint-of-the-day-v1';

type VaticanSaintCache = {
  date: string;
  name: string;
  updatedAt?: string;
};

function formatSaintUpdate(cache: VaticanSaintCache): string {
  if (cache.updatedAt) {
    const updatedAt = new Date(cache.updatedAt);
    if (!Number.isNaN(updatedAt.getTime())) {
      return `${updatedAt.toLocaleDateString('pt-BR')} às ${updatedAt.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
  }

  const [year, month, day] = cache.date.split('-');
  return `${day}/${month}/${year}`;
}

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
  {
    id: 'simbolo-dos-apostolos',
    title: 'Símbolo dos Apóstolos',
    description: 'Creio — profissão da fé cristã',
    icon: 'shield-outline',
    paragraphs: [
      'Creio em Deus Pai todo-poderoso, Criador do céu e da terra; e em Jesus Cristo, seu único Filho, nosso Senhor; que foi concebido pelo poder do Espírito Santo; nasceu da Virgem Maria; padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus; está sentado à direita de Deus Pai todo-poderoso, donde há de vir a julgar os vivos e os mortos.',
      'Creio no Espírito Santo; na Santa Igreja Católica; na comunhão dos santos; na remissão dos pecados; na ressurreição da carne; na vida eterna.',
      'Amém.',
    ],
  },
  {
    id: 'salve-rainha',
    title: 'Salve Rainha',
    description: 'Súplica à Mãe de misericórdia',
    icon: 'rose-outline',
    paragraphs: [
      'Salve, Rainha, Mãe de misericórdia, vida, doçura e esperança nossa, salve! A vós bradamos, os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas.',
      'Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei. E, depois deste desterro, mostrai-nos Jesus, bendito fruto do vosso ventre.',
      'Ó clemente, ó piedosa, ó doce sempre Virgem Maria.',
      'Rogai por nós, Santa Mãe de Deus, para que sejamos dignos das promessas de Cristo.',
      'Amém.',
    ],
  },
  {
    id: 'consagracao-nossa-senhora',
    title: 'Consagração a Nossa Senhora',
    description: 'Entrega pessoal à proteção maternal de Maria',
    icon: 'heart-circle-outline',
    paragraphs: [
      'Ó minha Senhora e minha Mãe, eu me ofereço inteiramente a vós e, em prova da minha devoção para convosco, vos consagro neste dia e para sempre os meus olhos, os meus ouvidos, a minha boca, o meu coração e inteiramente todo o meu ser.',
      'E porque assim sou vosso, ó incomparável Mãe, guardai-me e defendei-me como coisa e propriedade vossa.',
      'Amém.',
    ],
  },
  {
    id: 'angelus',
    title: 'Oração do Ângelus',
    description: 'Memória do mistério da Encarnação',
    icon: 'notifications-outline',
    paragraphs: [
      'O Anjo do Senhor anunciou a Maria. E ela concebeu do Espírito Santo.',
      'Ave Maria, cheia de graça, o Senhor é convosco. Bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora da nossa morte. Amém.',
      'Eis aqui a serva do Senhor. Faça-se em mim segundo a vossa palavra.',
      'Ave Maria, cheia de graça, o Senhor é convosco. Bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora da nossa morte. Amém.',
      'E o Verbo se fez carne. E habitou entre nós.',
      'Ave Maria, cheia de graça, o Senhor é convosco. Bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora da nossa morte. Amém.',
      'Rogai por nós, Santa Mãe de Deus. Para que sejamos dignos das promessas de Cristo.',
      'Oremos: Infundi, Senhor, em nossos corações a vossa graça, a fim de que, conhecendo pelo anúncio do Anjo a encarnação de Jesus Cristo, vosso Filho, cheguemos, por sua paixão e cruz, à glória da ressurreição. Por Cristo, nosso Senhor. Amém.',
    ],
  },
  {
    id: 'santo-anjo',
    title: 'Santo Anjo do Senhor',
    description: 'Oração ao Anjo da Guarda',
    icon: 'shield-outline',
    paragraphs: [
      'Santo Anjo do Senhor, meu zeloso guardador, se a ti me confiou a piedade divina, sempre me rege, guarda, governa e ilumina.',
      'Amém.',
    ],
  },
  {
    id: 'vinde-espirito-santo',
    title: 'Vinde, Espírito Santo',
    description: 'Invocação ao Espírito Consolador',
    icon: 'flame-outline',
    paragraphs: [
      'Vinde, Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do vosso amor. Enviai o vosso Espírito e tudo será criado. E renovareis a face da terra.',
      'Oremos: Ó Deus, que instruístes os corações dos vossos fiéis com a luz do Espírito Santo, fazei que apreciemos retamente todas as coisas segundo o mesmo Espírito e gozemos sempre da sua consolação. Por Cristo, nosso Senhor.',
      'Amém.',
    ],
  },
  {
    id: 'sao-francisco',
    title: 'Oração de São Francisco',
    description: 'Instrumento da paz de Cristo',
    icon: 'leaf-outline',
    paragraphs: [
      'Senhor, fazei-me instrumento de vossa paz.',
      'Concedei-me levar amor, perdão, união, verdade, esperança, luz e alegria a todos.',
      'Que eu procure mais consolar, compreender e amar do que ser consolado, compreendido e amado.',
      'Amém.',
    ],
  },
  {
    id: 'ato-de-contricao',
    title: 'Ato de Contrição',
    description: 'Arrependimento e pedido de misericórdia',
    icon: 'heart-outline',
    paragraphs: [
      'Meu Deus, arrependo-me de todo o coração de vos ter ofendido, porque sois infinitamente bom e digno de todo amor.',
      'Com a vossa graça, proponho firmemente evitar o pecado, reparar minhas faltas e buscar uma vida nova segundo o Evangelho.',
      'Senhor, tende piedade de mim e concedei-me o vosso perdão.',
      'Amém.',
    ],
  },
  {
    id: 'oracao-do-deitar',
    title: 'Oração do Deitar',
    description: 'Prece popular para confiar a noite a Deus',
    icon: 'moon-outline',
    paragraphs: [
      'Com Deus me deito,\nCom Deus me levanto,\nNa graça de Deus\nE do Divino Espírito Santo.\nNossa Senhora me cubra com vosso manto.',
      'Amém.',
    ],
  },
];

const PRAYER_GROUPS = [
  {
    title: 'Orações fundamentais',
    ids: ['pai-nosso', 'ave-maria', 'gloria-ao-pai', 'simbolo-dos-apostolos'],
  },
  {
    title: 'Orações marianas e devocionais',
    ids: ['salve-rainha', 'consagracao-nossa-senhora', 'angelus'],
  },
  {
    title: 'Orações aos santos e espirituais',
    ids: ['santo-anjo', 'vinde-espirito-santo', 'sao-francisco', 'protecao-sao-bento', 'ato-de-contricao'],
  },
  {
    title: 'Orações populares',
    ids: ['oracao-do-deitar'],
  },
];

export function PrayersScreen() {
  const { colors, fontSize } = useTheme();
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [today, setToday] = useState(() => toLocalIsoDate(new Date()));
  const [saintName, setSaintName] = useState('Carregando santo do dia…');
  const [saintLastUpdated, setSaintLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    function updateCurrentDate() {
      setToday(toLocalIsoDate(new Date()));
    }

    const now = new Date();
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const midnightTimer = setTimeout(updateCurrentDate, nextDay.getTime() - now.getTime() + 1000);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') updateCurrentDate();
    });

    return () => {
      clearTimeout(midnightTimer);
      appStateSubscription.remove();
    };
  }, [today]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadSaintOfTheDay() {
      let cachedSaint: VaticanSaintCache | null = null;

      try {
        const stored = await AsyncStorage.getItem(VATICAN_SAINT_CACHE_KEY);
        if (stored) {
          const cached = JSON.parse(stored) as Partial<VaticanSaintCache>;
          if (cached.date && cached.name) {
            cachedSaint = { date: cached.date, name: cached.name, updatedAt: cached.updatedAt };
            if (active) {
              setSaintName(cachedSaint.name);
              setSaintLastUpdated(formatSaintUpdate(cachedSaint));
            }

            if (cachedSaint.date === today) return;
          }
        }
      } catch {
        // Um cache inválido não deve impedir a consulta à fonte oficial.
      }

      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const saint = await fetchVaticanSaint(today, controller.signal);
        if (!saint) {
          if (active && !cachedSaint) setSaintName('Santo do dia indisponível');
          return;
        }

        const updatedAt = new Date().toISOString();
        const updatedCache = { date: today, name: saint.name, updatedAt } satisfies VaticanSaintCache;
        await AsyncStorage.setItem(
          VATICAN_SAINT_CACHE_KEY,
          JSON.stringify(updatedCache),
        );
        if (active) {
          setSaintName(saint.name);
          setSaintLastUpdated(formatSaintUpdate(updatedCache));
        }
      } catch {
        if (active && !cachedSaint) setSaintName('Santo do dia indisponível');
      } finally {
        clearTimeout(timeout);
      }
    }

    void loadSaintOfTheDay();

    return () => {
      active = false;
      controller.abort();
    };
  }, [today]);

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

        <View style={[styles.saintCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.saintIcon, { backgroundColor: colors.background }]}>
            <Ionicons name="calendar-outline" size={25} color={colors.primary} />
          </View>
          <View style={styles.saintContent}>
            <Text style={[styles.saintLabel, { color: colors.mutedText }]}>Santo do dia</Text>
            <Text style={[styles.saintName, { color: colors.text }]}>{saintName}</Text>
            {saintLastUpdated ? (
              <Text style={[styles.saintUpdatedAt, { color: colors.mutedText }]}>Última atualização: {saintLastUpdated}</Text>
            ) : null}
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Saiba mais sobre o santo do dia no Vatican News"
              hitSlop={8}
              onPress={() => void Linking.openURL(VATICAN_SAINT_OF_THE_DAY_URL)}
              style={({ pressed }) => [styles.saintLink, pressed && styles.pressed]}
            >
              <Text style={[styles.saintLinkText, { color: colors.primary }]}>saiba mais</Text>
              <Ionicons name="open-outline" size={14} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {PRAYER_GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.mutedText }]}>{group.title}</Text>
            {group.ids.map((id) => {
              const prayer = PRAYERS.find((item) => item.id === id);
              if (!prayer) return null;
              return (
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
              );
            })}
          </View>
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
                <Text
                  style={[
                    styles.sheetTitle,
                    { color: colors.text, fontSize: fontSize + 7, lineHeight: Math.round((fontSize + 7) * 1.2) },
                  ]}
                >
                  {selectedPrayer?.title}
                </Text>
                <Text
                  style={[
                    styles.sheetSubtitle,
                    {
                      color: colors.mutedText,
                      fontSize: Math.max(fontSize - 3, 12),
                      lineHeight: Math.round(Math.max(fontSize - 3, 12) * 1.4),
                    },
                  ]}
                >
                  {selectedPrayer?.description}
                </Text>
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
                  <Text
                    style={[
                      styles.shareText,
                      { color: colors.text, fontSize: Math.max(fontSize - 2, 13) },
                    ]}
                  >
                    Compartilhar oração
                  </Text>
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
  saintCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 22, padding: 16, borderWidth: 1, borderRadius: 16 },
  saintIcon: { width: 49, height: 49, alignItems: 'center', justifyContent: 'center', marginRight: 14, borderRadius: 15 },
  saintContent: { flex: 1 },
  saintLabel: { marginBottom: 4, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  saintName: { fontFamily: 'serif', fontSize: 18, fontWeight: '700', lineHeight: 23 },
  saintUpdatedAt: { marginTop: 5, fontSize: 10, lineHeight: 14 },
  saintLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, marginTop: 8 },
  saintLinkText: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  group: { marginBottom: 16 },
  groupTitle: { marginBottom: 9, marginLeft: 3, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
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
