import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentActions } from '../components/ContentActions';
import { useTheme } from '../context/ThemeContext';
import {
  getLiturgicalCalendarMetadata,
  getLiturgicalWeek,
  toLocalIsoDate,
} from '../services/liturgicalCalendarService';

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

function dateFromIso(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function ReadingCard({ heading, readings, colors, fontSize }) {
  if (!readings.length) return null;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionHeading, { color: colors.primary, fontSize: Math.max(fontSize - 2, 12) }]}>{heading}</Text>
      {readings.map((reading, index) => (
        <View key={`${reading.reference}-${index}`} style={index > 0 ? styles.additionalReading : undefined}>
          <Text style={[styles.reference, { color: colors.text, fontSize: fontSize + 2 }]}>{reading.reference}</Text>
          {reading.title ? <Text style={[styles.readingTitle, { color: colors.mutedText, fontSize }]}>{reading.title}</Text> : null}
          {reading.response ? <Text style={[styles.response, { color: colors.text, fontSize, lineHeight: Math.round(fontSize * 1.5) }]}>{reading.response}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function ReaderScreen() {
  const { colors, theme, fontSize, toggleTheme, increaseFontSize, decreaseFontSize } = useTheme();
  const week = useMemo(() => getLiturgicalWeek(new Date()), []);
  const today = toLocalIsoDate(new Date());
  const [selectedDate, setSelectedDate] = useState(
    week.some((day) => day.date === today) ? today : (week[0]?.date ?? ''),
  );
  const selectedLiturgy = week.find((day) => day.date === selectedDate);
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
    ...allReadings.map((reading) => `${reading.reference}${reading.response ? ` — ${reading.response}` : ''}`),
    '',
    'Compartilhado pelo Veritas',
  ].join('\n');

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        <Text style={[styles.screenTitle, { color: colors.text, fontSize: fontSize + 10 }]}>Liturgia da semana</Text>
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

        <ContentActions reference={liturgyReference} shareText={shareText} />
        <ReadingCard heading="Primeira leitura" readings={selectedLiturgy.readings.firstReading} colors={colors} fontSize={fontSize} />
        <ReadingCard heading="Salmo responsorial" readings={selectedLiturgy.readings.psalm} colors={colors} fontSize={fontSize} />
        <ReadingCard heading="Segunda leitura" readings={selectedLiturgy.readings.secondReading} colors={colors} fontSize={fontSize} />
        <ReadingCard heading="Evangelho" readings={selectedLiturgy.readings.gospel} colors={colors} fontSize={fontSize} />
        <ReadingCard heading="Leituras adicionais" readings={selectedLiturgy.readings.extras} colors={colors} fontSize={fontSize} />

        <Text style={[styles.sourceNotice, { color: colors.mutedText }]}>
          Calendário {metadata.year} para {metadata.region}. Celebrações próprias podem variar conforme a diocese.
        </Text>
      </ScrollView>

      <View style={[styles.floatingControls, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable accessibilityLabel="Diminuir tamanho do texto" hitSlop={8} onPress={decreaseFontSize} style={styles.controlButton}>
          <Text style={[styles.controlText, { color: colors.text }]}>A−</Text>
        </Pressable>
        <Pressable accessibilityLabel={`Mudar tema. Tema atual: ${theme}`} hitSlop={8} onPress={toggleTheme} style={styles.controlButton}>
          <Text style={[styles.themeControlText, { color: colors.primary }]}>◐</Text>
        </Pressable>
        <Pressable accessibilityLabel="Aumentar tamanho do texto" hitSlop={8} onPress={increaseFontSize} style={styles.controlButton}>
          <Text style={[styles.controlText, { color: colors.text }]}>A+</Text>
        </Pressable>
      </View>
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
  additionalReading: { marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  sourceNotice: { marginTop: 4, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  floatingControls: { position: 'absolute', right: 18, bottom: 18, flexDirection: 'row', alignItems: 'center',
    padding: 6, borderWidth: 1, borderRadius: 28, elevation: 6, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 6 },
  controlButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23 },
  controlText: { fontSize: 17, fontWeight: '700' }, themeControlText: { fontSize: 27, fontWeight: '700' },
});
