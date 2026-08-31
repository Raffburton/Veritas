import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentActions } from '../components/ContentActions';
import { useTheme } from '../context/ThemeContext';
import { getLiturgyWeek } from '../services/liturgyService';

function ReadingSection({ heading, reference, title, children, colors, fontSize }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionHeading, { color: colors.primary, fontSize: fontSize - 2 }]}>
        {heading}
      </Text>
      <Text style={[styles.reference, { color: colors.text, fontSize: fontSize + 2 }]}>
        {reference}
      </Text>
      {title ? (
        <Text style={[styles.readingTitle, { color: colors.text, fontSize }]}>{title}</Text>
      ) : null}
      <Text
        style={[
          styles.body,
          { color: colors.mutedText, fontSize, lineHeight: Math.round(fontSize * 1.55) },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export function ReaderScreen() {
  const {
    colors,
    theme,
    fontSize,
    toggleTheme,
    increaseFontSize,
    decreaseFontSize,
  } = useTheme();
  const week = useMemo(() => getLiturgyWeek(), []);
  const [selectedDate, setSelectedDate] = useState(week[0]?.date ?? '');
  const selectedLiturgy = week.find((day) => day.date === selectedDate);

  if (!selectedLiturgy) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, fontSize }}>Liturgia não encontrada.</Text>
      </View>
    );
  }

  const liturgyReference = {
    source: 'liturgy',
    id: `liturgy:${selectedLiturgy.date}`,
    title: `Liturgia de ${selectedLiturgy.weekday}`,
    location: selectedLiturgy.date.split('-').reverse().join('/'),
    excerpt: `${selectedLiturgy.firstReading.reference}: ${selectedLiturgy.firstReading.summary}`,
    date: selectedLiturgy.date,
    section: 'Liturgia do dia',
  };
  const shareText = [
    liturgyReference.title,
    liturgyReference.location,
    '',
    `Primeira leitura — ${selectedLiturgy.firstReading.reference}`,
    selectedLiturgy.firstReading.summary,
    '',
    `Salmo — ${selectedLiturgy.psalm.reference}`,
    selectedLiturgy.psalm.response,
    '',
    `Evangelho — ${selectedLiturgy.gospel.reference}`,
    selectedLiturgy.gospel.summary,
    '',
    'Compartilhado pelo Veritas',
  ].join('\n');

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.screenTitle, { color: colors.text, fontSize: fontSize + 10 }]}>
          Liturgia da semana
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          {week.map((day) => {
            const isSelected = day.date === selectedDate;

            return (
              <Pressable
                key={day.date}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelectedDate(day.date)}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    {
                      color: isSelected ? colors.background : colors.text,
                      fontSize: Math.max(fontSize - 3, 12),
                    },
                  ]}
                >
                  {day.weekday.replace('-feira', '')}
                </Text>
                <Text
                  style={{
                    color: isSelected ? colors.background : colors.mutedText,
                    fontSize: Math.max(fontSize - 4, 11),
                  }}
                >
                  {day.date.slice(8, 10)}/{day.date.slice(5, 7)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.dayHeader}>
          <Text style={[styles.dayTitle, { color: colors.text, fontSize: fontSize + 5 }]}>
            {selectedLiturgy.weekday}
          </Text>
          <Text style={[styles.dayMetadata, { color: colors.mutedText, fontSize: fontSize - 1 }]}>
            {selectedLiturgy.liturgicalSeason} · cor {selectedLiturgy.liturgicalColor}
          </Text>
        </View>

        <ContentActions reference={liturgyReference} shareText={shareText} />

        <ReadingSection
          heading="Primeira leitura"
          reference={selectedLiturgy.firstReading.reference}
          title={selectedLiturgy.firstReading.title}
          colors={colors}
          fontSize={fontSize}
        >
          {selectedLiturgy.firstReading.summary}
        </ReadingSection>

        <ReadingSection
          heading="Salmo responsorial"
          reference={selectedLiturgy.psalm.reference}
          colors={colors}
          fontSize={fontSize}
        >
          {selectedLiturgy.psalm.response}
        </ReadingSection>

        <ReadingSection
          heading="Evangelho"
          reference={selectedLiturgy.gospel.reference}
          title={selectedLiturgy.gospel.title}
          colors={colors}
          fontSize={fontSize}
        >
          {selectedLiturgy.gospel.summary}
        </ReadingSection>

        <ReadingSection
          heading="Santo do dia"
          reference={selectedLiturgy.saintOfTheDay.name}
          colors={colors}
          fontSize={fontSize}
        >
          {selectedLiturgy.saintOfTheDay.description}
        </ReadingSection>
      </ScrollView>

      <View
        accessibilityLabel="Controles de personalização"
        style={[
          styles.floatingControls,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Diminuir tamanho do texto"
          hitSlop={8}
          onPress={decreaseFontSize}
          style={({ pressed }) => [styles.controlButton, pressed && styles.controlPressed]}
        >
          <Text style={[styles.controlText, { color: colors.text }]}>A−</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mudar tema. Tema atual: ${theme}`}
          accessibilityHint="Alterna para o próximo tema de leitura"
          hitSlop={8}
          onPress={toggleTheme}
          style={({ pressed }) => [styles.controlButton, pressed && styles.controlPressed]}
        >
          <Text style={[styles.themeControlText, { color: colors.primary }]}>◐</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Aumentar tamanho do texto"
          hitSlop={8}
          onPress={increaseFontSize}
          style={({ pressed }) => [styles.controlButton, pressed && styles.controlPressed]}
        >
          <Text style={[styles.controlText, { color: colors.text }]}>A+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 112,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    marginBottom: 16,
    fontWeight: '700',
  },
  daySelector: {
    gap: 8,
    paddingBottom: 20,
  },
  dayButton: {
    minWidth: 76,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  dayButtonText: {
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dayHeader: {
    marginBottom: 14,
  },
  dayTitle: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  dayMetadata: {
    marginTop: 4,
  },
  card: {
    marginBottom: 14,
    padding: 18,
    borderWidth: 1,
    borderRadius: 14,
  },
  sectionHeading: {
    marginBottom: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  reference: {
    marginBottom: 5,
    fontWeight: '700',
  },
  readingTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  body: {
    fontWeight: '400',
  },
  floatingControls: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderWidth: 1,
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
  },
  controlButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
  },
  controlPressed: {
    opacity: 0.55,
  },
  controlText: {
    fontSize: 17,
    fontWeight: '700',
  },
  themeControlText: {
    fontSize: 27,
    fontWeight: '700',
  },
});
