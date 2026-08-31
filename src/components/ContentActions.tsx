import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import type { ContentReference } from '../types/library';

type ContentActionsProps = {
  reference: ContentReference;
  shareText: string;
};

export function ContentActions({ reference, shareText }: ContentActionsProps) {
  const { colors, fontSize } = useTheme();
  const { addNote, toggleSavedReading, isSaved } = useLibrary();
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const saved = isSaved(reference.id);

  async function saveNote() {
    await addNote(reference, noteBody);
    setNoteBody('');
    setNoteOpen(false);
  }

  return (
    <>
      <View style={[styles.actions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable accessibilityLabel="Adicionar nota vinculada" onPress={() => setNoteOpen(true)} style={styles.action}>
          <Ionicons name="create-outline" size={21} color={colors.primary} />
          <Text style={[styles.actionLabel, { color: colors.text }]}>Anotar</Text>
        </Pressable>
        <Pressable accessibilityLabel={saved ? 'Remover de ler depois' : 'Salvar para ler depois'}
          onPress={() => void toggleSavedReading(reference)} style={styles.action}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={21} color={colors.primary} />
          <Text style={[styles.actionLabel, { color: colors.text }]}>{saved ? 'Salvo' : 'Ler depois'}</Text>
        </Pressable>
        <Pressable accessibilityLabel="Compartilhar texto" onPress={() => void Share.share({ message: shareText })} style={styles.action}>
          <Ionicons name="share-social-outline" size={21} color={colors.primary} />
          <Text style={[styles.actionLabel, { color: colors.text }]}>Compartilhar</Text>
        </Pressable>
      </View>

      <Modal visible={noteOpen} transparent animationType="fade" onRequestClose={() => setNoteOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setNoteOpen(false)} />
          <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.dialogHeader}>
              <View style={styles.dialogTitleArea}>
                <Text style={[styles.dialogTitle, { color: colors.text }]}>Nova nota</Text>
                <Text style={[styles.reference, { color: colors.primary }]}>{reference.location}</Text>
              </View>
              <Pressable accessibilityLabel="Fechar" onPress={() => setNoteOpen(false)}>
                <Ionicons name="close" size={24} color={colors.mutedText} />
              </Pressable>
            </View>
            <Text numberOfLines={3} style={[styles.excerpt, { color: colors.mutedText }]}>{reference.excerpt}</Text>
            <TextInput
              autoFocus
              multiline
              placeholder="Escreva sua reflexão..."
              placeholderTextColor={colors.mutedText}
              value={noteBody}
              onChangeText={setNoteBody}
              style={[styles.input, { color: colors.text, borderColor: colors.border, fontSize }]}
            />
            <Pressable disabled={!noteBody.trim()} onPress={() => void saveNote()}
              style={[styles.saveButton, { backgroundColor: colors.primary, opacity: noteBody.trim() ? 1 : 0.4 }]}>
              <Text style={[styles.saveText, { color: colors.background }]}>Salvar nota</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', marginBottom: 16, paddingVertical: 9, borderWidth: 1, borderRadius: 13 },
  action: { flex: 1, alignItems: 'center', gap: 4 }, actionLabel: { fontSize: 11, fontWeight: '700' },
  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  dialog: { width: '100%', padding: 18, borderWidth: 1, borderRadius: 17 },
  dialogHeader: { flexDirection: 'row', alignItems: 'flex-start' }, dialogTitleArea: { flex: 1 },
  dialogTitle: { fontFamily: 'serif', fontSize: 22, fontWeight: '700' },
  reference: { marginTop: 2, fontSize: 12, fontWeight: '800' },
  excerpt: { marginTop: 13, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  input: { minHeight: 115, marginTop: 14, padding: 12, borderWidth: 1, borderRadius: 11, textAlignVertical: 'top' },
  saveButton: { alignItems: 'center', marginTop: 13, paddingVertical: 13, borderRadius: 10 },
  saveText: { fontSize: 14, fontWeight: '800' },
});
