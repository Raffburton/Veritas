import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AccessibleText as Text } from './AccessibleText';

type ShareCardReading = {
  reference?: string;
  title?: string;
  response?: string;
  text?: string;
};

type ShareCardProps = {
  category: string;
  readings: ShareCardReading[];
};

function normalizeText(text?: string) {
  return typeof text === 'string' ? text.replace(/(\d{1,3})(?=[A-Za-zÀ-ÖØ-öø-ÿ])/g, '$1 ') : '';
}

function getTextScale(readings: ShareCardReading[]) {
  const characterCount = readings.reduce((total, reading) => total + [reading.reference, reading.title, reading.response, reading.text]
    .filter(Boolean)
    .join(' ').length, 0);
  const estimatedHeight = 260 + characterCount * 1.18;
  return Math.max(0.28, Math.min(1, 720 / estimatedHeight));
}

export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard({ category, readings }, ref) {
  const textScale = getTextScale(readings);
  return (
    <View ref={ref} collapsable={false} style={styles.canvas}>
      <View style={styles.card}>
        <Text style={styles.brand}>veritas</Text>
        <Text style={[styles.category, { fontSize: Math.round(25 * textScale) }]}>{category.toUpperCase()}</Text>
        {readings.map((reading, index) => (
          <View key={`${reading.reference ?? reading.title ?? 'reading'}-${index}`} style={index ? styles.readingGap : undefined}>
            {reading.reference ? <Text style={[styles.reference, { fontSize: Math.round(35 * textScale) }]}>{reading.reference}</Text> : null}
            {reading.title ? <Text style={[styles.title, { fontSize: Math.round(28 * textScale), lineHeight: Math.round(40 * textScale) }]}>{reading.title}</Text> : null}
            {reading.response ? <Text style={[styles.response, { fontSize: Math.round(27 * textScale), lineHeight: Math.round(42 * textScale) }]}>{reading.response}</Text> : null}
            {reading.text ? <Text style={[styles.body, { fontSize: Math.round(28 * textScale), lineHeight: Math.round(45 * textScale) }]}>{normalizeText(reading.text)}</Text> : null}
          </View>
        ))}
        <Text style={styles.footer}>Compartilhado pelo Veritas</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  canvas: { width: 720, padding: 34, backgroundColor: '#000000' },
  card: { padding: 42, borderWidth: 2, borderColor: '#383838', borderRadius: 28, backgroundColor: '#171717' },
  brand: { marginBottom: 48, color: '#E8C75A', fontFamily: 'serif', fontSize: 54, fontWeight: '800', textAlign: 'center' },
  category: { marginBottom: 25, color: '#E8C75A', fontFamily: 'serif', fontSize: 25, fontWeight: '800', letterSpacing: 0.4 },
  reference: { marginBottom: 14, color: '#F5F5F5', fontFamily: 'serif', fontSize: 35, fontWeight: '800' },
  title: { marginBottom: 13, color: '#E5E5E5', fontFamily: 'serif', fontSize: 28, fontStyle: 'italic', lineHeight: 40 },
  response: { marginTop: 6, color: '#F5F5F5', fontFamily: 'serif', fontSize: 27, fontStyle: 'italic', lineHeight: 42 },
  body: { marginTop: 22, color: '#F5F5F5', fontFamily: 'serif', fontSize: 28, lineHeight: 45 },
  readingGap: { marginTop: 34, paddingTop: 34, borderTopWidth: 1, borderTopColor: '#383838' },
  footer: { marginTop: 42, color: '#999999', fontFamily: 'serif', fontSize: 18, textAlign: 'center' },
});
