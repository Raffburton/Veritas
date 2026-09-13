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

export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard({ category, readings }, ref) {
  return (
    <View ref={ref} collapsable={false} style={styles.canvas}>
      <View style={styles.card}>
        <Text style={styles.brand}>veritas</Text>
        <Text style={styles.category}>{category.toUpperCase()}</Text>
        {readings.map((reading, index) => (
          <View key={`${reading.reference ?? reading.title ?? 'reading'}-${index}`} style={index ? styles.readingGap : undefined}>
            {reading.reference ? <Text style={styles.reference}>{reading.reference}</Text> : null}
            {reading.title ? <Text style={styles.title}>{reading.title}</Text> : null}
            {reading.response ? <Text style={styles.response}>{reading.response}</Text> : null}
            {reading.text ? <Text style={styles.body}>{normalizeText(reading.text)}</Text> : null}
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
  brand: { marginBottom: 48, color: '#E8C75A', fontSize: 54, fontWeight: '800', textAlign: 'center' },
  category: { marginBottom: 25, color: '#E8C75A', fontSize: 25, fontWeight: '800', letterSpacing: 0.4 },
  reference: { marginBottom: 14, color: '#F5F5F5', fontSize: 35, fontWeight: '800' },
  title: { marginBottom: 13, color: '#E5E5E5', fontSize: 28, fontStyle: 'italic', lineHeight: 40 },
  response: { marginTop: 6, color: '#F5F5F5', fontSize: 27, fontStyle: 'italic', lineHeight: 42 },
  body: { marginTop: 22, color: '#F5F5F5', fontFamily: 'serif', fontSize: 28, lineHeight: 45 },
  readingGap: { marginTop: 34, paddingTop: 34, borderTopWidth: 1, borderTopColor: '#383838' },
  footer: { marginTop: 42, color: '#999999', fontSize: 18, textAlign: 'center' },
});
