import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import type { ContentReference } from '../types/library';

type ContentActionsProps = {
  reference: ContentReference;
  shareText: string;
  shareOptions?: Array<{ id: string; label: string; text: string }>;
};

export function ContentActions({ reference, shareText, shareOptions }: ContentActionsProps) {
  const { colors, fontSize } = useTheme();
  const { addNote, toggleSavedReading, isSaved } = useLibrary();
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedShareOptions, setSelectedShareOptions] = useState<string[]>([]);
  const saved = isSaved(reference.id);

  async function saveNote() {
    await addNote(reference, noteBody);
    setNoteBody('');
    setNoteOpen(false);
  }

  function openShare() {
    if (!shareOptions?.length) {
      void Share.share({ message: shareText });
      return;
    }
    setSelectedShareOptions(shareOptions.map((option) => option.id));
    setShareOpen(true);
  }

  function toggleShareOption(id: string) {
    setSelectedShareOptions((current) =>
      current.includes(id) ? current.filter((optionId) => optionId !== id) : [...current, id],
    );
  }

  async function shareSelected() {
    const selectedText = (shareOptions ?? [])
      .filter((option) => selectedShareOptions.includes(option.id))
      .map((option) => option.text)
      .join('\n\n');
    await Share.share({
      message: [reference.title, reference.location, '', selectedText, '', 'Compartilhado pelo Veritas'].join('\n'),
    });
    setShareOpen(false);
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
        <Pressable accessibilityLabel="Compartilhar texto" onPress={openShare} style={styles.action}>
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

      <Modal visible={shareOpen} transparent animationType="fade" onRequestClose={() => setShareOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setShareOpen(false)} />
          <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.dialogHeader}>
              <View style={styles.dialogTitleArea}>
                <Text style={[styles.dialogTitle, { color: colors.text }]}>O que compartilhar?</Text>
                <Text style={[styles.shareDescription, { color: colors.mutedText }]}>Selecione uma ou mais partes da liturgia.</Text>
              </View>
              <Pressable accessibilityLabel="Fechar" onPress={() => setShareOpen(false)}>
                <Ionicons name="close" size={24} color={colors.mutedText} />
              </Pressable>
            </View>

            <Pressable onPress={() => setSelectedShareOptions(
              selectedShareOptions.length === shareOptions?.length ? [] : (shareOptions ?? []).map((option) => option.id),
            )} style={styles.selectAll}>
              <Text style={[styles.selectAllText, { color: colors.primary }]}>
                {selectedShareOptions.length === shareOptions?.length ? 'Desmarcar tudo' : 'Selecionar tudo'}
              </Text>
            </Pressable>

            {(shareOptions ?? []).map((option) => {
              const selected = selectedShareOptions.includes(option.id);
              return (
                <Pressable key={option.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }}
                  onPress={() => toggleShareOption(option.id)} style={[styles.shareOption, { borderColor: colors.border }]}>
                  <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={23} color={selected ? colors.primary : colors.mutedText} />
                  <Text style={[styles.shareOptionText, { color: colors.text }]}>{option.label}</Text>
                </Pressable>
              );
            })}

            <Pressable disabled={!selectedShareOptions.length} onPress={() => void shareSelected()}
              style={[styles.saveButton, { backgroundColor: colors.primary, opacity: selectedShareOptions.length ? 1 : 0.4 }]}>
              <Text style={[styles.saveText, { color: colors.background }]}>Compartilhar seleção</Text>
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
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
  dialog: { width: '100%', padding: 18, borderWidth: 1, borderRadius: 17 },
  dialogHeader: { flexDirection: 'row', alignItems: 'flex-start' }, dialogTitleArea: { flex: 1 },
  dialogTitle: { fontFamily: 'serif', fontSize: 22, fontWeight: '700' },
  shareDescription: { marginTop: 3, fontSize: 12 },
  selectAll: { alignSelf: 'flex-end', paddingVertical: 9 },
  selectAllText: { fontSize: 12, fontWeight: '800' },
  shareOption: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 49, borderBottomWidth: StyleSheet.hairlineWidth },
  shareOptionText: { flex: 1, fontSize: 14, fontWeight: '600' },
  reference: { marginTop: 2, fontSize: 12, fontWeight: '800' },
  excerpt: { marginTop: 13, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  input: { minHeight: 115, marginTop: 14, padding: 12, borderWidth: 1, borderRadius: 11, textAlignVertical: 'top' },
  saveButton: { alignItems: 'center', marginTop: 13, paddingVertical: 13, borderRadius: 10 },
  saveText: { fontSize: 14, fontWeight: '800' },
});
