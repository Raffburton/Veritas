import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation, usePreventRemove } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, BackHandler, FlatList, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import type { RootTabParamList } from '../navigation/AppNavigator';
import type { ContentReference, LinkedNote, NoteFolder, SavedReading } from '../types/library';

type Section = 'notes' | 'favorites';
type FolderFilter = 'root' | string;
type DeleteTarget = { item: LinkedNote | SavedReading; section: Section };
type FolderImportance = NonNullable<NoteFolder['importance']>;

const FOLDER_COLORS = ['#E9C84A', '#D58A4A', '#B65F67', '#8A72B5', '#4F88B8', '#56936A'];
const IMPORTANCE_ORDER: Record<FolderImportance, number> = { high: 0, normal: 1, low: 2 };

function sourceLabel(reference: ContentReference) {
  return reference.source === 'bible' ? 'BÍBLIA' : 'LITURGIA';
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function shareReference(reference: ContentReference, note?: string) {
  const message = [reference.title, reference.location, '', reference.excerpt, note ? `\nMinha nota: ${note}` : '', '', 'Compartilhado pelo Veritas']
    .filter(Boolean).join('\n');
  return Share.share({ message });
}

export function NotesScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { colors, fontSize } = useTheme();
  const { notes, folders, savedReadings, ready, createFolder, updateFolder, deleteFolder, deleteNote, moveNoteToFolder, removeSavedReading } = useLibrary();
  const [section, setSection] = useState<Section>('notes');
  const [folderFilter, setFolderFilter] = useState<FolderFilter>('root');
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [moveTarget, setMoveTarget] = useState<LinkedNote | null>(null);
  const [noteToMoveIntoNewFolder, setNoteToMoveIntoNewFolder] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [folderToEdit, setFolderToEdit] = useState<NoteFolder | null>(null);
  const [editedFolderName, setEditedFolderName] = useState('');
  const [editedFolderColor, setEditedFolderColor] = useState(FOLDER_COLORS[0]);
  const [editedFolderImportance, setEditedFolderImportance] = useState<FolderImportance>('normal');

  const visibleNotes = useMemo(() => {
    if (folderFilter === 'root') return notes.filter((note) => !note.folderId);
    return notes.filter((note) => note.folderId === folderFilter);
  }, [folderFilter, notes]);
  const activeFolder = folders.find((folder) => folder.id === folderFilter);
  const sortedFolders = useMemo(() => [...folders].sort((a, b) => {
    const importanceDifference = IMPORTANCE_ORDER[a.importance ?? 'normal'] - IMPORTANCE_ORDER[b.importance ?? 'normal'];
    return importanceDifference || a.createdAt.localeCompare(b.createdAt);
  }), [folders]);
  const data: Array<LinkedNote | SavedReading> = section === 'notes' ? visibleNotes : savedReadings;

  usePreventRemove(section === 'notes' && folderFilter !== 'root', () => {
    setFolderFilter('root');
  });

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (section === 'favorites') {
          setSection('notes');
          return true;
        }
        if (folderFilter !== 'root') {
          setFolderFilter('root');
          return true;
        }
        return false;
      });

      return () => subscription.remove();
    }, [folderFilter, section]),
  );

  function openReference(reference: ContentReference) {
    if (reference.source === 'bible' && reference.bookIndex !== undefined) {
      navigation.navigate('Bible', { bookIndex: reference.bookIndex, chapter: reference.chapter, verses: reference.verseNumbers });
    } else if (reference.source === 'liturgy' && reference.date) {
      navigation.navigate('Liturgy', { date: reference.date });
    }
  }

  async function saveFolder() {
    const id = await createFolder(folderName);
    if (!id) return;
    setFolderName('');
    setFolderModalOpen(false);
    if (noteToMoveIntoNewFolder) {
      await moveNoteToFolder(noteToMoveIntoNewFolder, id);
      setNoteToMoveIntoNewFolder(null);
    }
    setFolderFilter(id);
  }

  function openFolderEditor(folder: NoteFolder) {
    setFolderToEdit(folder);
    setEditedFolderName(folder.name);
    setEditedFolderColor(folder.color ?? FOLDER_COLORS[0]);
    setEditedFolderImportance(folder.importance ?? 'normal');
  }

  async function saveFolderChanges() {
    if (!folderToEdit || !editedFolderName.trim()) return;
    await updateFolder(folderToEdit.id, {
      name: editedFolderName,
      color: editedFolderColor,
      importance: editedFolderImportance,
    });
    setFolderToEdit(null);
  }

  function confirmFolderDeletion(folder = activeFolder) {
    if (!folder) return;
    Alert.alert(`Excluir “${folder.name}”?`, 'As notas da pasta serão mantidas em “Sem pasta”.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir pasta', style: 'destructive', onPress: () => { if (folderFilter === folder.id) setFolderFilter('root'); setFolderToEdit(null); void deleteFolder(folder.id); } },
    ]);
  }

  function deleteSelectedItem() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    void (target.section === 'notes' ? deleteNote(target.item.id) : removeSavedReading(target.item.id));
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>SUA COLEÇÃO</Text>
        <Text style={[styles.title, { color: colors.text }]}>Notas e favoritos</Text>
        <View style={[styles.segmented, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {([['notes', 'Notas', notes.length, 'document-text-outline'], ['favorites', 'Favoritos', savedReadings.length, 'bookmark-outline']] as const).map(([value, label, count, icon]) => {
            const active = section === value;
            return (
              <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => setSection(value)} style={[styles.segment, active && { backgroundColor: colors.primary }]}>
                <Ionicons name={icon} size={17} color={active ? colors.background : colors.mutedText} />
                <Text style={[styles.segmentText, { color: active ? colors.background : colors.text }]}>{label}</Text>
                <View style={[styles.countBadge, { backgroundColor: active ? colors.background : colors.border }]}>
                  <Text style={[styles.countText, { color: active ? colors.primary : colors.text }]}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={({ id }) => id}
        contentContainerStyle={[styles.list, data.length === 0 && styles.emptyList]}
        ListHeaderComponent={section === 'notes' ? (
          folderFilter === 'root' ? (
            <View style={styles.fileManager}>
              <View style={styles.sectionHeading}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Pastas</Text>
                <Pressable accessibilityRole="button" onPress={() => setFolderModalOpen(true)} style={styles.newFolderLink}>
                  <Ionicons name="add" size={18} color={colors.primary} />
                  <Text style={[styles.newFolderText, { color: colors.primary }]}>Nova pasta</Text>
                </Pressable>
              </View>
              {folders.length ? (
                <View style={styles.folderGrid}>
                  {sortedFolders.map((folder) => {
                    const count = notes.filter((note) => note.folderId === folder.id).length;
                    return (
                      <Pressable
                        key={folder.id}
                        accessibilityHint="Toque para abrir. Toque e segure para editar a pasta."
                        onPress={() => setFolderFilter(folder.id)}
                        onLongPress={() => openFolderEditor(folder)}
                        style={({ pressed }) => [styles.folderTile, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
                      >
                        <View style={styles.folderTileTop}>
                          <Ionicons name="folder" size={31} color={folder.color ?? colors.primary} />
                          {folder.importance === 'high' ? <Ionicons name="star" size={14} color={folder.color ?? colors.primary} /> : null}
                          <Pressable accessibilityLabel={`Editar pasta ${folder.name}`} hitSlop={8} onPress={(event) => { event.stopPropagation(); openFolderEditor(folder); }}>
                            <Ionicons name="ellipsis-horizontal" size={18} color={colors.mutedText} />
                          </Pressable>
                        </View>
                        <Text numberOfLines={1} style={[styles.folderTileName, { color: colors.text }]}>{folder.name}</Text>
                        <Text style={[styles.folderTileCount, { color: colors.mutedText }]}>{count} {count === 1 ? 'nota' : 'notas'}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Pressable onPress={() => setFolderModalOpen(true)} style={[styles.firstFolder, { borderColor: colors.border }]}>
                  <Ionicons name="folder-open-outline" size={23} color={colors.primary} />
                  <Text style={[styles.firstFolderText, { color: colors.mutedText }]}>Crie uma pasta para arquivar suas notas</Text>
                </Pressable>
              )}
              <Text style={[styles.notesHeading, { color: colors.text }]}>Notas sem pasta</Text>
            </View>
          ) : (
            <View style={styles.openFolderHeader}>
              <Pressable onPress={() => setFolderFilter('root')} style={styles.backToRoot}>
                <Ionicons name="chevron-back" size={19} color={colors.primary} />
                <Text style={[styles.backToRootText, { color: colors.primary }]}>Todas as pastas</Text>
              </Pressable>
              <View style={styles.openFolderTitleRow}>
                <Ionicons name="folder-open" size={30} color={activeFolder?.color ?? colors.primary} />
                <View style={styles.referenceText}>
                  <Text style={[styles.openFolderTitle, { color: colors.text }]}>{activeFolder?.name}</Text>
                  <Text style={[styles.openFolderCount, { color: colors.mutedText }]}>{visibleNotes.length} {visibleNotes.length === 1 ? 'nota' : 'notas'}</Text>
                </View>
                <Pressable accessibilityLabel="Excluir pasta" hitSlop={10} onPress={confirmFolderDeletion}><Ionicons name="trash-outline" size={20} color={colors.mutedText} /></Pressable>
              </View>
            </View>
          )
        ) : null}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name={section === 'notes' ? 'document-text-outline' : 'bookmark-outline'} size={34} color={colors.primary} /></View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{!ready ? 'Carregando...' : section === 'notes' ? folderFilter === 'root' ? 'Nenhuma nota fora das pastas' : 'Esta pasta está vazia' : 'Nenhum favorito ainda'}</Text>
            {ready ? <Text style={[styles.emptyBody, { color: colors.mutedText }]}>{section === 'notes' ? folderFilter === 'root' ? 'As notas movidas para uma pasta ficam guardadas nela e não aparecem aqui.' : 'Mova uma nota para esta pasta usando o ícone de pasta.' : 'Toque em “Favoritos” durante uma leitura para encontrá-la aqui rapidamente.'}</Text> : null}
          </View>
        }
        renderItem={({ item }) => {
          const note = section === 'notes' ? item as LinkedNote : null;
          const reference = item.reference;
          const folder = note?.folderId ? folders.find((candidate) => candidate.id === note.folderId) : undefined;

          if (!note) {
            return (
              <Pressable accessibilityRole="link" onPress={() => openReference(reference)} style={({ pressed }) => [styles.favoriteCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
                <View style={[styles.favoriteIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="bookmark" size={22} color={colors.primary} /></View>
                <View style={styles.favoriteContent}>
                  <Text style={[styles.cardMeta, { color: colors.primary }]}>{sourceLabel(reference)} · {reference.location}</Text>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{reference.title}</Text>
                  <Text numberOfLines={3} style={[styles.excerpt, { color: colors.mutedText, fontSize: Math.max(fontSize - 2, 12) }]}>{reference.excerpt}</Text>
                  <Text style={[styles.openHint, { color: colors.primary }]}>Abrir texto  →</Text>
                </View>
                <Pressable accessibilityLabel="Remover dos favoritos" hitSlop={9} onPress={(event) => { event.stopPropagation(); setDeleteTarget({ item, section }); }}><Ionicons name="close" size={21} color={colors.mutedText} /></Pressable>
              </Pressable>
            );
          }

          return (
            <View style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.noteTopRow}>
                <View style={styles.noteDateRow}><Ionicons name="time-outline" size={14} color={colors.mutedText} /><Text style={[styles.noteDate, { color: colors.mutedText }]}>{formatDate(note.updatedAt)}</Text></View>
                <View style={styles.cardMenu}>
                  <Pressable accessibilityLabel="Mover para pasta" hitSlop={9} onPress={() => setMoveTarget(note)}><Ionicons name="folder-open-outline" size={20} color={colors.primary} /></Pressable>
                  <Pressable accessibilityLabel="Excluir nota" hitSlop={9} onPress={() => setDeleteTarget({ item, section })}><Ionicons name="trash-outline" size={19} color={colors.mutedText} /></Pressable>
                </View>
              </View>
              {folder ? <View style={[styles.folderLabel, { backgroundColor: `${folder.color ?? colors.primary}16` }]}><Ionicons name="folder" size={13} color={folder.color ?? colors.primary} /><Text style={[styles.folderLabelText, { color: folder.color ?? colors.primary }]}>{folder.name}</Text></View> : null}
              <Text style={[styles.noteBody, { color: colors.text, fontSize }]}>{note.body}</Text>
              <Pressable accessibilityRole="link" onPress={() => openReference(reference)} style={({ pressed }) => [styles.referenceButton, { backgroundColor: colors.background, borderColor: colors.border }, pressed && styles.pressed]}>
                <View style={[styles.referenceIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name={reference.source === 'bible' ? 'book-outline' : 'calendar-outline'} size={17} color={colors.primary} /></View>
                <View style={styles.referenceText}>
                  <Text style={[styles.cardMeta, { color: colors.primary }]}>{sourceLabel(reference)} · {reference.location}</Text>
                  <Text numberOfLines={1} style={[styles.referenceTitle, { color: colors.text }]}>{reference.title}</Text>
                  <Text numberOfLines={3} style={[styles.linkedExcerpt, { color: colors.mutedText, fontSize: Math.max(fontSize - 3, 11) }]}>{reference.excerpt}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
              </Pressable>
              <Pressable accessibilityLabel="Compartilhar nota" onPress={() => void shareReference(reference, note.body)} style={styles.shareAction}><Ionicons name="share-social-outline" size={17} color={colors.mutedText} /><Text style={[styles.shareText, { color: colors.mutedText }]}>Compartilhar</Text></Pressable>
            </View>
          );
        }}
      />

      <Modal visible={folderToEdit !== null} transparent animationType="fade" onRequestClose={() => setFolderToEdit(null)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setFolderToEdit(null)} />
          <View style={[styles.folderEditor, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.editorHeader}>
              <View style={[styles.editorFolderIcon, { backgroundColor: `${editedFolderColor}1F` }]}>
                <Ionicons name="folder" size={29} color={editedFolderColor} />
              </View>
              <View style={styles.referenceText}>
                <Text style={[styles.editorTitle, { color: colors.text }]}>Editar pasta</Text>
                <Text style={[styles.editorSubtitle, { color: colors.mutedText }]}>Personalize e organize por importância</Text>
              </View>
              <Pressable accessibilityLabel="Fechar editor" onPress={() => setFolderToEdit(null)}><Ionicons name="close" size={24} color={colors.mutedText} /></Pressable>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.text }]}>Nome</Text>
            <TextInput
              maxLength={40}
              value={editedFolderName}
              onChangeText={setEditedFolderName}
              selectTextOnFocus
              style={[styles.folderInput, styles.editorNameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />

            <Text style={[styles.fieldLabel, { color: colors.text }]}>Cor da pasta</Text>
            <View style={styles.colorOptions}>
              {FOLDER_COLORS.map((color) => {
                const selected = editedFolderColor === color;
                return (
                  <Pressable key={color} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`Cor ${color}`} onPress={() => setEditedFolderColor(color)} style={[styles.colorOption, { backgroundColor: color }, selected && styles.selectedColor]}>
                    {selected ? <Ionicons name="checkmark" size={20} color="#111111" /> : null}
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.text }]}>Importância</Text>
            <View style={[styles.importanceOptions, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {([['high', 'Alta', 'arrow-up'], ['normal', 'Normal', 'remove'], ['low', 'Baixa', 'arrow-down']] as const).map(([value, label, icon]) => {
                const selected = editedFolderImportance === value;
                return (
                  <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setEditedFolderImportance(value)} style={[styles.importanceOption, selected && { backgroundColor: editedFolderColor }]}>
                    <Ionicons name={icon} size={15} color={selected ? '#111111' : colors.mutedText} />
                    <Text style={[styles.importanceText, { color: selected ? '#111111' : colors.text }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.importanceHint, { color: colors.mutedText }]}>Pastas mais importantes aparecem primeiro.</Text>

            <View style={styles.editorActions}>
              <Pressable accessibilityRole="button" onPress={() => folderToEdit && confirmFolderDeletion(folderToEdit)} style={styles.removeFolderButton}>
                <Ionicons name="trash-outline" size={18} color="#C95B5B" />
                <Text style={styles.removeFolderText}>Apagar</Text>
              </Pressable>
              <Pressable disabled={!editedFolderName.trim()} onPress={() => void saveFolderChanges()} style={[styles.saveFolderButton, { backgroundColor: colors.primary, opacity: editedFolderName.trim() ? 1 : 0.4 }]}>
                <Text style={[styles.primaryButtonText, { color: colors.background }]}>Salvar alterações</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={folderModalOpen} transparent animationType="fade" onRequestClose={() => { setFolderModalOpen(false); setNoteToMoveIntoNewFolder(null); }}>
        <View style={styles.modalRoot}><Pressable style={styles.backdrop} onPress={() => { setFolderModalOpen(false); setNoteToMoveIntoNewFolder(null); }} />
          <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.dialogIcon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="folder-open-outline" size={27} color={colors.primary} /></View>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Nova pasta</Text><Text style={[styles.dialogBody, { color: colors.mutedText }]}>Dê um nome para organizar suas reflexões.</Text>
            <TextInput autoFocus maxLength={40} placeholder="Ex.: Estudos, Orações..." placeholderTextColor={colors.mutedText} value={folderName} onChangeText={setFolderName} onSubmitEditing={() => void saveFolder()} style={[styles.folderInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} />
            <View style={styles.dialogActions}><Pressable onPress={() => { setFolderModalOpen(false); setNoteToMoveIntoNewFolder(null); }} style={[styles.dialogButton, { borderColor: colors.border }]}><Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancelar</Text></Pressable><Pressable disabled={!folderName.trim()} onPress={() => void saveFolder()} style={[styles.dialogButton, { backgroundColor: colors.primary, opacity: folderName.trim() ? 1 : 0.4 }]}><Text style={[styles.primaryButtonText, { color: colors.background }]}>Criar pasta</Text></Pressable></View>
          </View>
        </View>
      </Modal>

      <Modal visible={moveTarget !== null} animationType="slide" onRequestClose={() => setMoveTarget(null)}>
        <View style={[styles.sheetRoot, { backgroundColor: colors.background }]}>
          <View style={styles.sheetHeader}><View style={styles.referenceText}><Text style={[styles.sheetTitle, { color: colors.text }]}>Mover nota</Text><Text style={[styles.sheetSubtitle, { color: colors.mutedText }]}>Escolha uma pasta</Text></View><Pressable accessibilityLabel="Fechar" onPress={() => setMoveTarget(null)}><Ionicons name="close-circle" size={29} color={colors.mutedText} /></Pressable></View>
          <ScrollView contentContainerStyle={styles.sheetList}>
            {([{ id: undefined, name: 'Sem pasta' }, ...sortedFolders] as Array<{ id?: string; name: string }>).map((folder) => {
              const selected = moveTarget?.folderId === folder.id;
              return <Pressable key={folder.id ?? 'unfiled'} onPress={() => { if (moveTarget) void moveNoteToFolder(moveTarget.id, folder.id); setMoveTarget(null); }} style={[styles.folderOption, { borderColor: colors.border, backgroundColor: selected ? `${colors.primary}16` : colors.surface }]}><Ionicons name={folder.id ? 'folder-outline' : 'file-tray-outline'} size={22} color={selected ? colors.primary : colors.mutedText} /><Text style={[styles.folderOptionText, { color: colors.text }]}>{folder.name}</Text>{selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}</Pressable>;
            })}
            <Pressable onPress={() => { setNoteToMoveIntoNewFolder(moveTarget?.id ?? null); setMoveTarget(null); setFolderModalOpen(true); }} style={styles.createFromSheet}><Ionicons name="add-circle-outline" size={21} color={colors.primary} /><Text style={[styles.createFromSheetText, { color: colors.primary }]}>Criar nova pasta</Text></Pressable>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={deleteTarget !== null} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={styles.modalRoot}><Pressable style={styles.backdrop} onPress={() => setDeleteTarget(null)} />
          <View style={[styles.deleteDialog, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.deleteIcon}><Ionicons name="trash-outline" size={28} color="#C95B5B" /></View><Text style={[styles.dialogTitle, { color: colors.text }]}>{deleteTarget?.section === 'notes' ? 'Excluir nota?' : 'Remover dos favoritos?'}</Text><Text style={[styles.dialogBody, { color: colors.mutedText }]}>Esta ação não poderá ser desfeita.</Text><View style={styles.dialogActions}><Pressable onPress={() => setDeleteTarget(null)} style={[styles.dialogButton, { borderColor: colors.border }]}><Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancelar</Text></Pressable><Pressable onPress={deleteSelectedItem} style={[styles.dialogButton, styles.deleteButton]}><Text style={styles.deleteButtonText}>Excluir</Text></Pressable></View></View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingHorizontal: 18, paddingTop: 17, paddingBottom: 10 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { marginTop: 4, marginBottom: 16, fontFamily: 'serif', fontSize: 30, fontWeight: '700' },
  segmented: { flexDirection: 'row', padding: 4, borderWidth: 1, borderRadius: 14 }, segment: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 10 }, segmentText: { fontSize: 13, fontWeight: '800' }, countBadge: { minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderRadius: 11 }, countText: { fontSize: 10, fontWeight: '900' },
  fileManager: { marginBottom: 16 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, sectionTitle: { flex: 1, fontFamily: 'serif', fontSize: 20, fontWeight: '700' }, newFolderLink: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 5 }, newFolderText: { fontSize: 12, fontWeight: '800' },
  folderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, folderTile: { width: '48%', minHeight: 96, padding: 13, borderWidth: 1, borderRadius: 15 }, folderTileTop: { flexDirection: 'row', alignItems: 'center' }, folderTileName: { marginTop: 7, fontSize: 13, fontWeight: '800' }, folderTileCount: { marginTop: 2, fontSize: 10, fontWeight: '600' }, firstFolder: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14 }, firstFolderText: { flex: 1, fontSize: 12 }, notesHeading: { marginTop: 18, fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
  openFolderHeader: { marginBottom: 16 }, backToRoot: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginBottom: 15 }, backToRootText: { fontSize: 12, fontWeight: '800' }, openFolderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 11 }, openFolderTitle: { fontFamily: 'serif', fontSize: 23, fontWeight: '700' }, openFolderCount: { marginTop: 2, fontSize: 11 },
  folderArea: { paddingBottom: 5 }, folderRow: { gap: 8, paddingHorizontal: 18, paddingVertical: 7 }, folderChip: { maxWidth: 170, minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, borderWidth: 1, borderRadius: 19 }, folderChipText: { maxWidth: 94, fontSize: 12, fontWeight: '700' }, folderCount: { fontSize: 10, fontWeight: '700' }, addFolder: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, borderWidth: 1, borderStyle: 'dashed', borderRadius: 19 }, addFolderText: { fontSize: 12, fontWeight: '800' }, folderHeading: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 7 }, folderHeadingText: { flex: 1, fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
  list: { padding: 18, paddingTop: 8, paddingBottom: 38 }, emptyList: { flexGrow: 1 }, empty: { alignItems: 'center', marginTop: 8, paddingHorizontal: 28, paddingVertical: 40, borderWidth: 1, borderRadius: 20 }, emptyIcon: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 35 }, emptyTitle: { marginTop: 17, fontSize: 17, fontWeight: '800' }, emptyBody: { maxWidth: 300, marginTop: 7, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  favoriteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12, padding: 15, borderWidth: 1, borderRadius: 17 }, favoriteIcon: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 13 }, favoriteContent: { flex: 1 }, cardMeta: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }, cardTitle: { marginTop: 5, fontFamily: 'serif', fontSize: 17, fontWeight: '700' }, excerpt: { marginTop: 7, fontStyle: 'italic', lineHeight: 19 }, openHint: { marginTop: 11, fontSize: 11, fontWeight: '800' },
  noteCard: { marginBottom: 10, padding: 13, borderWidth: 1, borderRadius: 15 }, noteTopRow: { flexDirection: 'row', alignItems: 'center' }, noteDateRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }, noteDate: { fontSize: 9, fontWeight: '600', textTransform: 'capitalize' }, cardMenu: { flexDirection: 'row', alignItems: 'center', gap: 15 }, folderLabel: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7 }, folderLabelText: { fontSize: 9, fontWeight: '800' }, noteBody: { marginTop: 11, marginBottom: 11, lineHeight: 22 }, referenceButton: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 9, borderWidth: 1, borderRadius: 10 }, referenceIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 9 }, referenceText: { flex: 1 }, referenceTitle: { marginTop: 1, fontSize: 11, fontWeight: '700' }, linkedExcerpt: { marginTop: 5, lineHeight: 17 }, shareAction: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 }, shareText: { fontSize: 9, fontWeight: '700' },
  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 23 }, backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.72)' }, dialog: { width: '100%', maxWidth: 370, padding: 22, borderWidth: 1, borderRadius: 22 }, deleteDialog: { width: '100%', maxWidth: 360, alignItems: 'center', padding: 23, borderWidth: 1, borderRadius: 22 }, dialogIcon: { width: 55, height: 55, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderRadius: 17 }, deleteIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', marginBottom: 15, backgroundColor: 'rgba(201,91,91,0.13)', borderRadius: 29 }, dialogTitle: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', textAlign: 'center' }, dialogBody: { marginTop: 6, fontSize: 13, lineHeight: 19, textAlign: 'center' }, folderInput: { height: 50, marginTop: 18, paddingHorizontal: 14, borderWidth: 1, borderRadius: 12, fontSize: 15 }, dialogActions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 20 }, dialogButton: { flex: 1, minHeight: 47, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent', borderRadius: 12 }, secondaryButtonText: { fontSize: 13, fontWeight: '800' }, primaryButtonText: { fontSize: 13, fontWeight: '900' }, deleteButton: { backgroundColor: '#B84D4D' }, deleteButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  folderEditor: { width: '100%', maxWidth: 390, padding: 20, borderWidth: 1, borderRadius: 22 }, editorHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 }, editorFolderIcon: { width: 53, height: 53, alignItems: 'center', justifyContent: 'center', borderRadius: 16 }, editorTitle: { fontFamily: 'serif', fontSize: 21, fontWeight: '700' }, editorSubtitle: { marginTop: 2, fontSize: 10 }, fieldLabel: { marginTop: 18, marginBottom: 8, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }, editorNameInput: { marginTop: 0 }, colorOptions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, colorOption: { width: 39, height: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }, selectedColor: { borderWidth: 3, borderColor: '#FFFFFF' }, importanceOptions: { flexDirection: 'row', padding: 4, borderWidth: 1, borderRadius: 12 }, importanceOption: { flex: 1, minHeight: 39, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 9 }, importanceText: { fontSize: 11, fontWeight: '800' }, importanceHint: { marginTop: 7, fontSize: 10 }, editorActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22 }, removeFolderButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8 }, removeFolderText: { color: '#C95B5B', fontSize: 12, fontWeight: '800' }, saveFolderButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  sheetRoot: { flex: 1, paddingTop: 65 }, sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 }, sheetTitle: { fontFamily: 'serif', fontSize: 27, fontWeight: '700' }, sheetSubtitle: { marginTop: 2, fontSize: 12 }, sheetList: { gap: 9, padding: 18 }, folderOption: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, borderWidth: 1, borderRadius: 14 }, folderOptionText: { flex: 1, fontSize: 14, fontWeight: '700' }, createFromSheet: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 }, createFromSheetText: { fontSize: 13, fontWeight: '800' }, pressed: { opacity: 0.65 },
});
