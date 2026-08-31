import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  THEME_COLORS,
  THEME_OPTIONS,
  useTheme,
  type AppTheme,
} from '../context/ThemeContext';
import { getImportantCatholicDates } from '../services/importantDatesService';

type Panel = 'theme' | 'font' | 'dates' | 'devotion' | 'about' | 'technologies' | 'support' | null;

const THEME_LABELS: Record<AppTheme, string> = {
  'light-white': 'Claro',
  'dark-navy': 'Azul escuro',
  'dark-black': 'Preto',
  'light-yellow': 'Papel',
};

const PANEL_TITLES: Record<Exclude<Panel, null>, string> = {
  theme: 'Tema da leitura',
  font: 'Tamanho do texto',
  dates: 'Datas importantes',
  devotion: 'Consagração e devoção',
  about: 'Sobre o Veritas',
  technologies: 'Tecnologias',
  support: 'Apoie o desenvolvedor',
};

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  last?: boolean;
};

function SettingsRow({ icon, title, description, onPress, colors, last }: SettingsRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={21} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <Text numberOfLines={1} style={[styles.rowDescription, { color: colors.mutedText }]}>
          {description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={colors.mutedText} />
    </Pressable>
  );
}

export function SettingsScreen() {
  const {
    colors,
    theme,
    fontSize,
    setTheme,
    increaseFontSize,
    decreaseFontSize,
  } = useTheme();
  const [panel, setPanel] = useState<Panel>(null);
  const importantDates = getImportantCatholicDates();

  function closePanel() {
    setPanel(null);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Configurações</Text>
        <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>LEITURA</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            icon="color-palette-outline"
            title="Tema da leitura"
            description={THEME_LABELS[theme]}
            onPress={() => setPanel('theme')}
            colors={colors}
          />
          <SettingsRow
            icon="text-outline"
            title="Tamanho do texto"
            description={`${fontSize} pontos`}
            onPress={() => setPanel('font')}
            colors={colors}
            last
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>CALENDÁRIO E DEVOÇÃO</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            icon="calendar-outline"
            title="Datas importantes"
            description={`Celebrações de ${new Date().getFullYear()}`}
            onPress={() => setPanel('dates')}
            colors={colors}
          />
          <SettingsRow
            icon="heart-circle-outline"
            title="Consagração e devoção"
            description="Ato pessoal de entrega e fé"
            onPress={() => setPanel('devotion')}
            colors={colors}
            last
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>VERITAS</Text>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            icon="information-circle-outline"
            title="Sobre o app"
            description="Propósito, recursos e versão"
            onPress={() => setPanel('about')}
            colors={colors}
          />
          <SettingsRow
            icon="code-slash-outline"
            title="Tecnologias"
            description="Como o Veritas foi construído"
            onPress={() => setPanel('technologies')}
            colors={colors}
          />
          <SettingsRow
            icon="heart-outline"
            title="Apoie o desenvolvedor"
            description="PIX, contato e GitHub"
            onPress={() => setPanel('support')}
            colors={colors}
            last
          />
        </View>

        <View style={styles.offlineNotice}>
          <Ionicons name="cloud-offline-outline" size={17} color={colors.primary} />
          <Text style={[styles.offlineText, { color: colors.mutedText }]}>Leituras e notas disponíveis offline</Text>
        </View>
      </ScrollView>

      <Modal visible={panel !== null} transparent animationType="slide" onRequestClose={closePanel}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Fechar painel" style={styles.backdrop} onPress={closePanel} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {panel ? PANEL_TITLES[panel] : ''}
              </Text>
              <Pressable accessibilityLabel="Fechar" hitSlop={10} onPress={closePanel}>
                <Ionicons name="close" size={25} color={colors.mutedText} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              {panel === 'theme' ? (
                <View style={styles.themeGrid}>
                  {THEME_OPTIONS.map((option: AppTheme) => {
                    const active = option === theme;
                    const preview = THEME_COLORS[option];
                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          setTheme(option);
                          closePanel();
                        }}
                        style={[
                          styles.themeCard,
                          {
                            backgroundColor: preview.background,
                            borderColor: active ? colors.primary : preview.border,
                            borderWidth: active ? 3 : 1,
                          },
                        ]}
                      >
                        <View style={[styles.themePreview, { backgroundColor: preview.surface }]}>
                          <View style={[styles.previewLine, { backgroundColor: preview.primary }]} />
                          <View style={[styles.previewLineShort, { backgroundColor: preview.mutedText }]} />
                        </View>
                        <View style={styles.themeFooter}>
                          <Text style={[styles.themeName, { color: preview.text }]}>{THEME_LABELS[option]}</Text>
                          {active ? <Ionicons name="checkmark-circle" size={21} color={preview.primary} /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {panel === 'font' ? (
                <View>
                  <View style={[styles.fontPreviewCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.fontSample, { color: colors.text, fontSize, lineHeight: Math.round(fontSize * 1.5) }]}>A Palavra é luz para os nossos caminhos.</Text>
                  </View>
                  <View style={styles.fontControls}>
                    <Pressable disabled={fontSize <= MIN_FONT_SIZE} onPress={decreaseFontSize}
                      style={[styles.fontButton, { borderColor: colors.border }]}>
                      <Text style={[styles.fontButtonText, { color: colors.primary }]}>A−</Text>
                    </Pressable>
                    <View style={styles.fontValueBox}>
                      <Text style={[styles.fontValue, { color: colors.text }]}>{fontSize}</Text>
                      <Text style={[styles.fontUnit, { color: colors.mutedText }]}>pontos</Text>
                    </View>
                    <Pressable disabled={fontSize >= MAX_FONT_SIZE} onPress={increaseFontSize}
                      style={[styles.fontButton, { borderColor: colors.border }]}>
                      <Text style={[styles.fontButtonText, { color: colors.primary }]}>A+</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {panel === 'dates' ? (
                <View>
                  <Text style={[styles.datesIntro, { color: colors.mutedText }]}>Principais celebrações do calendário católico no Brasil em {new Date().getFullYear()}. Datas móveis são recalculadas a cada ano.</Text>
                  {importantDates.map((item) => (
                    <View key={item.id} style={[styles.dateCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <View style={[styles.dateBadge, { borderColor: colors.primary }]}>
                        <Text style={[styles.dateDay, { color: colors.primary }]}>{String(item.date.getDate()).padStart(2, '0')}</Text>
                        <Text style={[styles.dateMonth, { color: colors.mutedText }]}>{item.date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}</Text>
                      </View>
                      <View style={styles.dateTextArea}>
                        <Text style={[styles.dateTitle, { color: colors.text }]}>{item.title}</Text>
                        <Text style={[styles.dateDescription, { color: colors.mutedText }]}>{item.description}</Text>
                      </View>
                    </View>
                  ))}
                  <Text style={[styles.localCalendarNotice, { color: colors.mutedText }]}>Algumas celebrações podem ter observância própria conforme a diocese.</Text>
                </View>
              ) : null}

              {panel === 'devotion' ? (
                <View>
                  <View style={styles.devotionIntro}>
                    <View style={[styles.devotionIcon, { borderColor: colors.primary }]}>
                      <Ionicons name="heart-outline" size={27} color={colors.primary} />
                    </View>
                    <Text style={[styles.devotionTitle, { color: colors.text }]}>Ato de Consagração e Devoção Pessoal</Text>
                    <Text style={[styles.devotionLead, { color: colors.mutedText }]}>Por este registro, declaro e renovo minha entrega e devoção:</Text>
                  </View>

                  {[
                    {
                      title: 'A Nosso Senhor Jesus Cristo',
                      text: 'Centro da minha vida, meu Senhor e Salvador, a quem entrego meus caminhos, ações e pensamentos.',
                      icon: 'sunny-outline' as const,
                    },
                    {
                      title: 'A Nossa Senhora Menina',
                      text: 'Exemplo de pureza, humildade e entrega desde a infância, a quem peço a proteção maternal e a graça de um coração simples.',
                      icon: 'rose-outline' as const,
                    },
                    {
                      title: 'A São Bento',
                      text: 'Meu guardião e intercessor, a quem recorro pedindo proteção contra todo o mal espiritual e físico, buscando sempre a paz e a sabedoria.',
                      icon: 'shield-checkmark-outline' as const,
                    },
                  ].map((devotion) => (
                    <View key={devotion.title} style={[styles.devotionCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Ionicons name={devotion.icon} size={22} color={colors.primary} />
                      <View style={styles.devotionTextArea}>
                        <Text style={[styles.devotionItemTitle, { color: colors.text }]}>{devotion.title}</Text>
                        <Text style={[styles.devotionItemBody, { color: colors.mutedText, fontSize }]}>{devotion.text}</Text>
                      </View>
                    </View>
                  ))}

                  <Text style={[styles.devotionClosing, { color: colors.primary, fontSize }]}>Que esta devoção guie meus passos diários e guarde minha jornada.</Text>
                </View>
              ) : null}

              {panel === 'about' ? (
                <View style={styles.centeredPanel}>
                  <View style={[styles.brandMark, { borderColor: colors.primary }]}>
                    <Ionicons name="book-outline" size={31} color={colors.primary} />
                  </View>
                  <Text style={[styles.brand, { color: colors.primary }]}>veritas</Text>
                  <Text style={[styles.tagline, { color: colors.text }]}>Liturgia · Leitura · Estudo</Text>
                  <Text style={[styles.paragraph, { color: colors.mutedText }]}>Um aplicativo católico para acompanhar a liturgia, ler a Palavra e registrar reflexões, com foco em simplicidade, acessibilidade e funcionamento offline.</Text>
                  <Text style={[styles.version, { color: colors.mutedText }]}>Versão 1.0.0</Text>
                </View>
              ) : null}

              {panel === 'technologies' ? (
                <View style={styles.technologyList}>
                  {['Expo SDK 54', 'React Native', 'TypeScript', 'React Navigation', 'AsyncStorage'].map((technology) => (
                    <View key={technology} style={[styles.technology, { borderBottomColor: colors.border }]}>
                      <Ionicons name="checkmark-circle-outline" size={21} color={colors.primary} />
                      <Text style={[styles.technologyText, { color: colors.text }]}>{technology}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {panel === 'support' ? (
                <View style={styles.centeredPanel}>
                  <Ionicons name="heart-outline" size={38} color={colors.primary} />
                  <Text style={[styles.supportTitle, { color: colors.text }]}>Ajude o Veritas a crescer</Text>
                  <Text style={[styles.paragraph, { color: colors.mutedText }]}>Sua contribuição ajuda a manter e aprimorar o Veritas.</Text>
                  <View style={[styles.pixCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.pixHeader}>
                      <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
                      <Text style={[styles.pixTitle, { color: colors.text }]}>Doação via PIX</Text>
                    </View>
                    <Text style={[styles.pixDetail, { color: colors.mutedText }]}>Banco Inter · Rafael Matos</Text>
                    <Text selectable style={[styles.pixKey, { color: colors.text, borderColor: colors.border }]}>
                      e8d32269-fa6a-4d2f-8817-befb4accd685
                    </Text>
                    <Text style={[styles.pixHint, { color: colors.mutedText }]}>Mantenha a chave pressionada para copiá-la.</Text>
                  </View>
                  <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('mailto:raffburton.dev@gmail.com')}
                    style={[styles.contactButton, { borderColor: colors.border }]}>
                    <Ionicons name="mail-outline" size={21} color={colors.primary} />
                    <Text style={[styles.contactValue, { color: colors.text }]}>raffburton.dev@gmail.com</Text>
                    <Ionicons name="open-outline" size={17} color={colors.mutedText} />
                  </Pressable>
                  <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://github.com/Raffburton')}
                    style={[styles.contactButton, { borderColor: colors.border }]}>
                    <Ionicons name="logo-github" size={21} color={colors.primary} />
                    <Text style={[styles.contactValue, { color: colors.text }]}>github.com/Raffburton</Text>
                    <Ionicons name="open-outline" size={17} color={colors.mutedText} />
                  </Pressable>
                </View>
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
  title: { marginBottom: 24, fontFamily: 'serif', fontSize: 28, fontWeight: '700' },
  sectionLabel: { marginBottom: 8, marginLeft: 4, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  group: { marginBottom: 24, overflow: 'hidden', borderWidth: 1, borderRadius: 14 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 72, paddingHorizontal: 14 },
  rowIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderRadius: 11 },
  rowText: { flex: 1 }, rowTitle: { marginBottom: 3, fontSize: 15, fontWeight: '700' },
  rowDescription: { fontSize: 12 }, pressed: { opacity: 0.55 },
  offlineNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 2 },
  offlineText: { fontSize: 12, fontWeight: '600' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  sheet: { width: '100%', maxHeight: '88%', paddingTop: 9, borderWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { alignSelf: 'center', width: 42, height: 4, marginBottom: 10, borderRadius: 2 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 13 },
  sheetTitle: { flex: 1, fontFamily: 'serif', fontSize: 22, fontWeight: '700' },
  sheetContent: { paddingHorizontal: 20, paddingBottom: 34 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeCard: { width: '48%', minHeight: 124, padding: 12, borderRadius: 14 },
  themePreview: { height: 58, padding: 12, borderRadius: 8 },
  previewLine: { width: '75%', height: 5, marginBottom: 8, borderRadius: 3 },
  previewLineShort: { width: '48%', height: 4, borderRadius: 2 },
  themeFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 11 },
  themeName: { flex: 1, fontSize: 14, fontWeight: '700' },
  fontPreviewCard: { minHeight: 150, alignItems: 'center', justifyContent: 'center', padding: 20, borderWidth: 1, borderRadius: 14 },
  fontSample: { fontFamily: 'serif', textAlign: 'center' },
  fontControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 20 },
  fontButton: { width: 62, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12 },
  fontButtonText: { fontSize: 20, fontWeight: '800' },
  fontValueBox: { alignItems: 'center', minWidth: 58 }, fontValue: { fontSize: 24, fontWeight: '800' },
  fontUnit: { marginTop: 1, fontSize: 11 },
  datesIntro: { marginBottom: 15, fontSize: 13, lineHeight: 19 },
  dateCard: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 9, padding: 12, borderWidth: 1, borderRadius: 12 },
  dateBadge: { width: 52, height: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 10 },
  dateDay: { fontSize: 20, fontWeight: '800' }, dateMonth: { fontSize: 9, fontWeight: '800' },
  dateTextArea: { flex: 1 }, dateTitle: { marginBottom: 4, fontFamily: 'serif', fontSize: 16, fontWeight: '700' },
  dateDescription: { fontSize: 12, lineHeight: 17 },
  localCalendarNotice: { marginTop: 8, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  devotionIntro: { alignItems: 'center', marginBottom: 18 },
  devotionIcon: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderRadius: 27 },
  devotionTitle: { fontFamily: 'serif', fontSize: 21, fontWeight: '700', textAlign: 'center' },
  devotionLead: { marginTop: 8, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  devotionCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10, padding: 14, borderWidth: 1, borderRadius: 12 },
  devotionTextArea: { flex: 1 },
  devotionItemTitle: { marginBottom: 5, fontFamily: 'serif', fontSize: 16, fontWeight: '700' },
  devotionItemBody: { lineHeight: 22 },
  devotionClosing: { marginTop: 12, fontFamily: 'serif', fontStyle: 'italic', fontWeight: '600', lineHeight: 24, textAlign: 'center' },
  centeredPanel: { alignItems: 'center' },
  brandMark: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 33 },
  brand: { marginTop: 7, fontFamily: 'serif', fontSize: 34, fontWeight: '700' },
  tagline: { marginTop: 2, fontFamily: 'serif', fontSize: 14, fontWeight: '600' },
  paragraph: { marginTop: 15, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  version: { marginTop: 17, fontSize: 11, fontWeight: '700' },
  technologyList: { overflow: 'hidden' },
  technology: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, borderBottomWidth: StyleSheet.hairlineWidth },
  technologyText: { fontSize: 15, fontWeight: '600' },
  supportTitle: { marginTop: 9, fontFamily: 'serif', fontSize: 20, fontWeight: '700' },
  pixCard: { width: '100%', marginTop: 16, padding: 14, borderWidth: 1, borderRadius: 12 },
  pixHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  pixTitle: { fontSize: 15, fontWeight: '800' },
  pixDetail: { marginTop: 9, fontSize: 13, fontWeight: '600' },
  pixKey: { marginTop: 11, paddingVertical: 11, paddingHorizontal: 10, borderWidth: 1, borderRadius: 8, fontSize: 12, lineHeight: 18 },
  pixHint: { marginTop: 7, fontSize: 10 },
  contactButton: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 58, marginTop: 10, paddingHorizontal: 13, borderWidth: 1, borderRadius: 11 },
  contactValue: { flex: 1, fontSize: 13, fontWeight: '600' },
});
