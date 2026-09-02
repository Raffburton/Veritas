import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentActions } from '../components/ContentActions';
import { useDailyLiturgy } from '../context/DailyLiturgyContext';
import { useTheme } from '../context/ThemeContext';
import {
  getLiturgicalCalendarMetadata,
  getLiturgicalDay,
  toLocalIsoDate,
} from '../services/liturgicalCalendarService';

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const HIDDEN_CONTROLS_OFFSET = 162;

function dateFromIso(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function readingShareBlock(label, readings) {
  if (!readings.length) return [];
  return [
    label.toUpperCase(),
    ...readings.flatMap((reading) => [
      [reading.reference, reading.title].filter(Boolean).join(' — '),
      reading.response,
      reading.text,
      '',
    ].filter((line) => line !== undefined && line !== null)),
  ];
}

function ReadingCard({ heading, readings, colors, fontSize }) {
  if (!readings.length) return null;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionHeading, { color: colors.primary, fontSize: Math.max(fontSize - 2, 12) }]}>{heading}</Text>
      {readings.map((reading, index) => (
        <View key={`${reading.reference}-${index}`} style={index > 0 ? styles.additionalReading : undefined}>
          {reading.reference ? <Text style={[styles.reference, { color: colors.text, fontSize: fontSize + 2 }]}>{reading.reference}</Text> : null}
          {reading.title ? <Text style={[styles.readingTitle, { color: colors.mutedText, fontSize }]}>{reading.title}</Text> : null}
          {reading.response ? <Text style={[styles.response, { color: colors.text, fontSize, lineHeight: Math.round(fontSize * 1.5) }]}>{reading.response}</Text> : null}
          {reading.text ? <Text style={[styles.readingText, { color: colors.text, fontSize, lineHeight: Math.round(fontSize * 1.62) }]}>{reading.text}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function ReaderScreen({ route }) {
  const { colors, theme, fontSize, toggleTheme, increaseFontSize, decreaseFontSize } = useTheme();
  const [controlsHidden, setControlsHidden] = useState(false);
  const controlsTranslateX = useRef(new Animated.Value(0)).current;
  const animateControls = (hidden) => {
    setControlsHidden(hidden);
    Animated.spring(controlsTranslateX, {
      toValue: hidden ? HIDDEN_CONTROLS_OFFSET : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 4,
    }).start();
  };
  const controlsPanResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => (
      Math.abs(gesture.dx) > 10
      && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.3
      && (controlsHidden ? gesture.dx < 0 : gesture.dx > 0)
    ),
    onPanResponderMove: (_, gesture) => {
      const startOffset = controlsHidden ? HIDDEN_CONTROLS_OFFSET : 0;
      controlsTranslateX.setValue(Math.max(0, Math.min(HIDDEN_CONTROLS_OFFSET, startOffset + gesture.dx)));
    },
    onPanResponderRelease: (_, gesture) => {
      const shouldHide = controlsHidden
        ? !(gesture.dx < -36 || gesture.vx < -0.45)
        : gesture.dx > 36 || gesture.vx > 0.45;
      animateControls(shouldHide);
    },
    onPanResponderTerminate: () => animateControls(controlsHidden),
  }), [controlsHidden, controlsTranslateX]);
  const {
    getSyncedDay,
    getPapalWords,
    loadPapalWords,
    papalWordsLoading,
    papalWordsUnavailable,
    syncing,
    lastUpdated,
  } = useDailyLiturgy();
  const requestedDate = route?.params?.date;
  const weekDates = useMemo(() => {
    const now = requestedDate ? dateFromIso(requestedDate) : new Date();
    const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + index);
      return toLocalIsoDate(date);
    });
  }, [requestedDate]);
  const week = weekDates
    .map((date) => getSyncedDay(date) ?? getLiturgicalDay(date))
    .filter(Boolean);
  const today = toLocalIsoDate(new Date());
  const [selectedDate, setSelectedDate] = useState(
    requestedDate ?? today,
  );
  useEffect(() => {
    if (requestedDate) setSelectedDate(requestedDate);
  }, [requestedDate]);
  useEffect(() => {
    void loadPapalWords(selectedDate);
  }, [loadPapalWords, selectedDate]);
  const selectedLiturgy = week.find((day) => day.date === selectedDate);
  const selectedPapalWords = getPapalWords(selectedDate);
  const metadata = getLiturgicalCalendarMetadata();

  if (!selectedLiturgy) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, fontSize }}>Calendário litúrgico indisponível para esta data.</Text>
      </View>
    );
  }

  const selectedDateObject = dateFromIso(selectedLiturgy.date);
  const allReadings = [
    ...selectedLiturgy.readings.firstReading,
    ...selectedLiturgy.readings.psalm,
    ...selectedLiturgy.readings.secondReading,
    ...selectedLiturgy.readings.gospel,
  ];
  const liturgyReference = {
    source: 'liturgy',
    id: `liturgy:${selectedLiturgy.date}`,
    title: selectedLiturgy.celebration,
    location: selectedLiturgy.date.split('-').reverse().join('/'),
    excerpt: allReadings.map((reading) => reading.reference).join(' · '),
    date: selectedLiturgy.date,
    section: 'Liturgia do dia',
  };
  const shareText = [
    selectedLiturgy.celebration,
    liturgyReference.location,
    `Cor litúrgica: ${selectedLiturgy.color}`,
    '',
    ...(selectedLiturgy.antiphons?.entrance
      ? ['ANTÍFONA DE ENTRADA', selectedLiturgy.antiphons.entrance, '']
      : []),
    ...(selectedLiturgy.prayers?.collect
      ? ['ORAÇÃO DA COLETA', selectedLiturgy.prayers.collect, '']
      : []),
    ...readingShareBlock('Primeira leitura', selectedLiturgy.readings.firstReading),
    ...readingShareBlock('Salmo responsorial', selectedLiturgy.readings.psalm),
    ...readingShareBlock('Segunda leitura', selectedLiturgy.readings.secondReading),
    ...readingShareBlock('Evangelho', selectedLiturgy.readings.gospel),
    ...readingShareBlock('Leituras adicionais', selectedLiturgy.readings.extras),
    ...(selectedLiturgy.prayers?.offerings
      ? ['ORAÇÃO SOBRE AS OFERENDAS', selectedLiturgy.prayers.offerings, '']
      : []),
    ...(selectedLiturgy.antiphons?.communion
      ? ['ANTÍFONA DA COMUNHÃO', selectedLiturgy.antiphons.communion, '']
      : []),
    ...(selectedLiturgy.prayers?.communion
      ? ['ORAÇÃO DEPOIS DA COMUNHÃO', selectedLiturgy.prayers.communion, '']
      : []),
    ...(selectedLiturgy.prayers?.extras ?? []).flatMap((prayer) => [
      prayer.title?.toUpperCase() ?? 'ORAÇÃO',
      prayer.text,
      '',
    ]),
    '',
    'Compartilhado pelo Veritas',
  ].filter((line) => line !== undefined && line !== null).join('\n');
  const shareOptions = [
    {
      id: 'first-reading',
      label: 'Primeira leitura',
      text: readingShareBlock('Primeira leitura', selectedLiturgy.readings.firstReading).join('\n').trim(),
    },
    {
      id: 'psalm',
      label: 'Salmo responsorial',
      text: readingShareBlock('Salmo responsorial', selectedLiturgy.readings.psalm).join('\n').trim(),
    },
    ...(selectedLiturgy.readings.secondReading.length
      ? [{
          id: 'second-reading',
          label: 'Segunda leitura',
          text: readingShareBlock('Segunda leitura', selectedLiturgy.readings.secondReading).join('\n').trim(),
        }]
      : []),
    {
      id: 'gospel',
      label: 'Evangelho',
      text: readingShareBlock('Evangelho', selectedLiturgy.readings.gospel).join('\n').trim(),
    },
  ].filter((option) => option.text);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        <Text style={[styles.screenTitle, { color: colors.text, fontSize: fontSize + 10 }]}>Liturgia da semana</Text>
        <View style={styles.syncStatus}>
          <View style={[styles.syncDot, { backgroundColor: syncing ? colors.mutedText : colors.primary }]} />
          <Text style={[styles.syncText, { color: colors.mutedText }]}>
            {syncing
              ? 'Atualizando liturgia...'
              : lastUpdated
                ? `Atualizada em ${new Date(lastUpdated).toLocaleDateString('pt-BR')}`
                : 'Calendário disponível offline'}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelector}>
          {week.map((day) => {
            const date = dateFromIso(day.date);
            const selected = day.date === selectedDate;
            return (
              <Pressable key={day.date} accessibilityRole="button" accessibilityState={{ selected }}
                onPress={() => setSelectedDate(day.date)} style={[styles.dayButton, {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                }]}>
                <Text style={[styles.dayButtonText, { color: selected ? colors.background : colors.text,
                  fontSize: Math.max(fontSize - 3, 12) }]}>{WEEKDAYS[date.getDay()].replace('-feira', '')}</Text>
                <Text style={{ color: selected ? colors.background : colors.mutedText,
                  fontSize: Math.max(fontSize - 4, 11) }}>{String(date.getDate()).padStart(2, '0')}/{String(date.getMonth() + 1).padStart(2, '0')}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.dayHeader}>
          <Text style={[styles.dayTitle, { color: colors.text, fontSize: fontSize + 4 }]}>{selectedLiturgy.celebration}</Text>
          <Text style={[styles.dayMetadata, { color: colors.mutedText, fontSize: fontSize - 1 }]}>
            {WEEKDAYS[selectedDateObject.getDay()]} · cor {selectedLiturgy.color.toLocaleLowerCase('pt-BR')}
          </Text>
        </View>

        <ContentActions reference={liturgyReference} shareText={shareText} shareOptions={shareOptions} />
        <ReadingCard heading="Primeira leitura" readings={selectedLiturgy.readings.firstReading} colors={colors} fontSize={fontSize} />
        <ReadingCard heading="Salmo responsorial" readings={selectedLiturgy.readings.psalm} colors={colors} fontSize={fontSize} />
        <ReadingCard heading="Segunda leitura" readings={selectedLiturgy.readings.secondReading} colors={colors} fontSize={fontSize} />
        <ReadingCard heading="Evangelho" readings={selectedLiturgy.readings.gospel} colors={colors} fontSize={fontSize} />
        <View style={[styles.card, styles.papalWordsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.primary, fontSize: Math.max(fontSize - 2, 12) }]}>Palavras do Papa</Text>
          {selectedPapalWords ? (
            <>
              <Text style={[styles.papalWordsText, { color: colors.text, fontSize, lineHeight: Math.round(fontSize * 1.62) }]}>
                {selectedPapalWords.text}
              </Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Abrir fonte no Vatican News"
                onPress={() => void Linking.openURL(selectedPapalWords.sourceUrl).catch(() => undefined)}
                style={styles.sourceLink}
              >
                <Text style={[styles.sourceLinkText, { color: colors.primary }]}>Fonte: Vatican News</Text>
              </Pressable>
            </>
          ) : (
            <Text style={[styles.papalWordsStatus, { color: colors.mutedText }]}>
              {papalWordsLoading[selectedDate]
                ? 'Carregando reflexão...'
                : papalWordsUnavailable[selectedDate]
                  ? 'Reflexão papal indisponível para esta data.'
                  : 'Preparando reflexão...'}
            </Text>
          )}
        </View>
        <ReadingCard heading="Leituras adicionais" readings={selectedLiturgy.readings.extras} colors={colors} fontSize={fontSize} />

        <Text style={[styles.sourceNotice, { color: colors.mutedText }]}>
          Calendário {metadata.year} para {metadata.region}. Celebrações próprias podem variar conforme a diocese.
        </Text>
      </ScrollView>

      <Animated.View
        {...controlsPanResponder.panHandlers}
        style={[
          styles.floatingControls,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            transform: [{ translateX: controlsTranslateX }],
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={controlsHidden ? 'Mostrar controles de leitura' : 'Ocultar controles de leitura'}
          accessibilityHint={controlsHidden ? 'Restaura os controles de fonte e tema' : 'Recolhe os controles para a lateral da tela'}
          hitSlop={8}
          onPress={() => animateControls(!controlsHidden)}
          style={styles.controlHandle}
        >
          <Text style={[styles.handleText, { color: colors.primary }]}>{controlsHidden ? '‹' : '›'}</Text>
        </Pressable>
        <Pressable accessibilityLabel="Diminuir tamanho do texto" hitSlop={8} onPress={decreaseFontSize} style={styles.controlButton}>
          <Text style={[styles.controlText, { color: colors.text }]}>A−</Text>
        </Pressable>
        <Pressable accessibilityLabel={`Mudar tema. Tema atual: ${theme}`} hitSlop={8} onPress={toggleTheme} style={styles.controlButton}>
          <Text style={[styles.themeControlText, { color: colors.primary }]}>◐</Text>
        </Pressable>
        <Pressable accessibilityLabel="Aumentar tamanho do texto" hitSlop={8} onPress={increaseFontSize} style={styles.controlButton}>
          <Text style={[styles.controlText, { color: colors.text }]}>A+</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 18, paddingBottom: 112 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  screenTitle: { marginBottom: 16, fontFamily: 'serif', fontWeight: '700' },
  daySelector: { gap: 8, paddingBottom: 20 },
  dayButton: { minWidth: 76, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 12 },
  dayButtonText: { marginBottom: 2, fontWeight: '600', textTransform: 'capitalize' },
  dayHeader: { marginBottom: 14 }, dayTitle: { fontFamily: 'serif', fontWeight: '700' },
  dayMetadata: { marginTop: 5, textTransform: 'capitalize' },
  card: { marginBottom: 14, padding: 18, borderWidth: 1, borderRadius: 14 },
  sectionHeading: { marginBottom: 9, fontWeight: '800', textTransform: 'uppercase' },
  reference: { marginBottom: 5, fontWeight: '700' }, readingTitle: { lineHeight: 22 },
  response: { marginTop: 9, fontFamily: 'serif', fontStyle: 'italic' },
  readingText: { marginTop: 13, fontFamily: 'serif' },
  papalWordsCard: { borderLeftWidth: 4 },
  papalWordsText: { fontFamily: 'serif' },
  papalWordsStatus: { fontSize: 13, fontStyle: 'italic' },
  sourceLink: { alignSelf: 'flex-start', marginTop: 14, paddingVertical: 4 },
  sourceLinkText: { fontSize: 11, fontWeight: '800' },
  additionalReading: { marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  sourceNotice: { marginTop: 4, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  syncStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -9, marginBottom: 15 },
  syncDot: { width: 7, height: 7, borderRadius: 4 }, syncText: { fontSize: 10, fontWeight: '700' },
  floatingControls: { position: 'absolute', right: 18, bottom: 18, flexDirection: 'row', alignItems: 'center',
    padding: 6, borderWidth: 1, borderRadius: 28, elevation: 6, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 6 },
  controlHandle: { width: 32, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23 },
  controlButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23 },
  handleText: { fontSize: 32, fontWeight: '500', lineHeight: 35 },
  controlText: { fontSize: 17, fontWeight: '700' }, themeControlText: { fontSize: 27, fontWeight: '700' },
});
