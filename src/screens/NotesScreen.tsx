import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, FlatList, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import type { ContentReference, LinkedNote, SavedReading } from '../types/library';

type Section = 'notes' | 'saved';

function sourceLabel(reference: ContentReference) {
  return reference.source === 'bible' ? 'BÍBLIA' : 'LITURGIA';
}

function shareReference(reference: ContentReference, note?: string) {
  const message = [
    reference.title,
    reference.location,
    '',
    reference.excerpt,
    note ? `\nMinha nota: ${note}` : '',
    '',
    'Compartilhado pelo Veritas',
  ].filter(Boolean).join('\n');
  return Share.share({ message });
}

export function NotesScreen() {
  const { colors, fontSize } = useTheme();
  const { notes, savedReadings, ready, deleteNote, removeSavedReading } = useLibrary();
  const [section, setSection] = useState<Section>('notes');
  const data = section === 'notes' ? notes : savedReadings;

  function confirmDelete(item: LinkedNote | SavedReading) {
    Alert.alert(
      section === 'notes' ? 'Excluir nota' : 'Remover de ler depois',
      'Esta ação não poderá ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => void (section === 'notes' ? deleteNote(item.id) : removeSavedReading(item.id)),
        },
      ],
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Minha biblioteca</Text>
        <View style={[styles.segmented, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {([['notes', 'Notas', notes.length], ['saved', 'Ler depois', savedReadings.length]] as const).map(
            ([value, label, count]) => {
              const active = section === value;
              return (
                <Pressable key={value} onPress={() => setSection(value)} style={[
                  styles.segment, active && { backgroundColor: colors.primary },
                ]}>
                  <Text style={[styles.segmentText, { color: active ? colors.background : colors.text }]}>
                    {label} · {count}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={({ id }) => id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Ionicons
              name={section === 'notes' ? 'create-outline' : 'bookmark-outline'}
              size={38}
              color={colors.primary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {!ready ? 'Carregando...' : section === 'notes' ? 'Nenhuma nota vinculada' : 'Nada salvo para ler depois'}
            </Text>
            {ready ? (
              <Text style={[styles.emptyBody, { color: colors.mutedText }]}>
                {section === 'notes'
                  ? 'Use “Anotar” em uma leitura para registrar sua reflexão junto ao texto.'
                  : 'Use “Ler depois” para guardar uma leitura ou trecho para outro momento.'}
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const note = section === 'notes' ? (item as LinkedNote) : null;
          const reference = item.reference;
          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: colors.background }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{sourceLabel(reference)}</Text>
                </View>
                <Text style={[styles.location, { color: colors.primary }]}>{reference.location}</Text>
                <Pressable accessibilityLabel="Excluir item" hitSlop={9} onPress={() => confirmDelete(item)}>
                  <Ionicons name="trash-outline" size={19} color={colors.mutedText} />
                </Pressable>
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{reference.title}</Text>
              <View style={[styles.sourceBlock, { borderLeftColor: colors.primary }]}>
                <Text numberOfLines={4} style={[styles.excerpt, { color: colors.mutedText, fontSize: Math.max(fontSize - 2, 12) }]}>
                  {reference.excerpt}
                </Text>
              </View>
              {note ? (
                <View style={[styles.noteBlock, { backgroundColor: colors.background }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={17} color={colors.primary} />
                  <Text style={[styles.noteBody, { color: colors.text, fontSize }]}>{note.body}</Text>
                </View>
              ) : null}
              <View style={styles.cardActions}>
                <View style={styles.linkedLabel}>
                  <Ionicons name="link-outline" size={16} color={colors.mutedText} />
                  <Text style={[styles.linkedText, { color: colors.mutedText }]}>Vinculado ao texto</Text>
                </View>
                <Pressable accessibilityLabel="Compartilhar" hitSlop={8}
                  onPress={() => void shareReference(reference, note?.body)}>
                  <Ionicons name="share-social-outline" size={20} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { padding: 18, paddingBottom: 10 },
  title: { marginBottom: 15, fontFamily: 'serif', fontSize: 28, fontWeight: '700' },
  segmented: { flexDirection: 'row', padding: 4, borderWidth: 1, borderRadius: 11 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 8 },
  segmentText: { fontSize: 13, fontWeight: '700' }, list: { padding: 18, paddingTop: 6, paddingBottom: 34 },
  empty: { alignItems: 'center', padding: 30, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14 },
  emptyTitle: { marginTop: 11, fontSize: 16, fontWeight: '700' },
  emptyBody: { marginTop: 6, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  card: { marginBottom: 12, padding: 15, borderWidth: 1, borderRadius: 13 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 5 },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  location: { flex: 1, fontSize: 11, fontWeight: '800' },
  cardTitle: { marginTop: 11, marginBottom: 8, fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
  sourceBlock: { paddingLeft: 11, borderLeftWidth: 3 }, excerpt: { fontStyle: 'italic', lineHeight: 20 },
  noteBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 13, padding: 12, borderRadius: 9 },
  noteBody: { flex: 1, lineHeight: 22 },
  cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  linkedLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  linkedText: { fontSize: 10, fontWeight: '700' },
});
