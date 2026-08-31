import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ContentActions } from '../components/ContentActions';
import { useTheme } from '../context/ThemeContext';
import type { RootTabParamList } from '../navigation/AppNavigator';
import { bibleBooks, getBibleBook, getBibleChapter } from '../services/bibleService';
import type { ContentReference } from '../types/library';

type Filter = 'Todos' | 'Antigo Testamento' | 'Novo Testamento';
type Props = BottomTabScreenProps<RootTabParamList, 'Bible'>;

function versesLabel(numbers: number[]) {
  if (!numbers.length) return '';
  const sorted = [...numbers].sort((a, b) => a - b);
  const consecutive = sorted.every((number, index) => index === 0 || number === sorted[index - 1] + 1);
  return consecutive && sorted.length > 1 ? `${sorted[0]}-${sorted.at(-1)}` : sorted.join('.');
}

export function BibleScreen({ route, navigation }: Props) {
  const { colors, fontSize } = useTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Todos');
  const [bookIndex, setBookIndex] = useState<number | null>(route.params?.bookIndex ?? null);
  const [chapterNumber, setChapterNumber] = useState(route.params?.chapter ?? 1);
  const [selectedVerses, setSelectedVerses] = useState<number[]>(route.params?.verses ?? []);

  useEffect(() => {
    if (route.params?.bookIndex === undefined) return;
    setBookIndex(route.params.bookIndex);
    setChapterNumber(route.params.chapter ?? 1);
    setSelectedVerses(route.params.verses ?? []);
  }, [route.params]);

  useEffect(
    () =>
      navigation.addListener('tabPress', () => {
        setBookIndex(null);
        setChapterNumber(1);
        setSelectedVerses([]);
      }),
    [navigation],
  );

  useFocusEffect(
    useCallback(() => {
      if (bookIndex === null) return undefined;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        setBookIndex(null);
        setSelectedVerses([]);
        return true;
      });
      return () => subscription.remove();
    }, [bookIndex]),
  );

  const filteredBooks = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    return bibleBooks.filter((book) =>
      (filter === 'Todos' || book.testament === filter) &&
      (!normalized || book.name.toLocaleLowerCase('pt-BR').includes(normalized) ||
        book.abbreviation.toLocaleLowerCase('pt-BR').includes(normalized)),
    );
  }, [filter, query]);

  const book = bookIndex === null ? null : getBibleBook(bookIndex);
  const summary = bookIndex === null ? null : bibleBooks[bookIndex];
  const chapter = bookIndex === null ? null : getBibleChapter(bookIndex, chapterNumber);

  function openBook(index: number) {
    setBookIndex(index);
    setChapterNumber(1);
    setSelectedVerses([]);
  }

  function chooseChapter(number: number) {
    setChapterNumber(number);
    setSelectedVerses([]);
  }

  function toggleVerse(number: number) {
    setSelectedVerses((current) =>
      current.includes(number) ? current.filter((verse) => verse !== number) : [...current, number].sort((a, b) => a - b),
    );
  }

  if (book && summary && chapter) {
    const chosenVerses = selectedVerses.length
      ? chapter.versiculos.filter((verse) => selectedVerses.includes(verse.numero))
      : chapter.versiculos;
    const location = selectedVerses.length
      ? `${summary.abbreviation} ${chapterNumber},${versesLabel(selectedVerses)}`
      : `${summary.abbreviation} ${chapterNumber}`;
    const fullText = chosenVerses.map((verse) => `${verse.numero} ${verse.texto}`).join('\n');
    const reference: ContentReference = {
      source: 'bible',
      id: `bible:${bookIndex}:${chapterNumber}:${selectedVerses.length ? selectedVerses.join(',') : 'chapter'}`,
      title: book.livro,
      location,
      excerpt: fullText.length > 600 ? `${fullText.slice(0, 600)}…` : fullText,
      book: book.livro,
      bookIndex: summary.index,
      chapter: chapterNumber,
      ...(selectedVerses.length
        ? {
            verseStart: selectedVerses[0],
            verseEnd: selectedVerses.at(-1),
            verseNumbers: selectedVerses,
          }
        : {}),
    };
    const shareText = [location, book.livro, '', fullText, '', 'Compartilhado pelo Veritas'].join('\n');

    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <FlatList
          data={chapter.versiculos}
          keyExtractor={(verse) => String(verse.numero)}
          contentContainerStyle={styles.readerContent}
          ListHeaderComponent={
            <>
              <Pressable accessibilityRole="button" onPress={() => setBookIndex(null)} style={styles.backButton}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
                <Text style={[styles.backText, { color: colors.primary }]}>Todos os livros</Text>
              </Pressable>
              <View style={styles.readerHeader}>
                <View style={styles.readerTitleArea}>
                  <Text style={[styles.readerTitle, { color: colors.text }]}>{book.livro}</Text>
                  <Text style={[styles.readerSubtitle, { color: colors.mutedText }]}>Capítulo {chapterNumber} de {book.capitulos.length}</Text>
                </View>
                {selectedVerses.length ? (
                  <Pressable onPress={() => setSelectedVerses([])} style={[styles.clearButton, { borderColor: colors.border }]}>
                    <Text style={[styles.clearText, { color: colors.primary }]}>Limpar · {selectedVerses.length}</Text>
                  </Pressable>
                ) : null}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chapters}>
                {book.capitulos.map(({ capitulo }) => {
                  const active = capitulo === chapterNumber;
                  return (
                    <Pressable key={capitulo} onPress={() => chooseChapter(capitulo)} style={[
                      styles.chapterButton,
                      { backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border },
                    ]}>
                      <Text style={{ color: active ? colors.background : colors.text, fontWeight: '700' }}>{capitulo}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Text style={[styles.selectionHint, { color: colors.mutedText }]}> 
                {selectedVerses.length
                  ? `${selectedVerses.length} ${selectedVerses.length === 1 ? 'versículo selecionado' : 'versículos selecionados'}.`
                  : 'Toque em um ou mais versículos para selecioná-los.'}
              </Text>
              <ContentActions reference={reference} shareText={shareText} />
            </>
          }
          renderItem={({ item: verse }) => {
            const selected = selectedVerses.includes(verse.numero);
            return (
              <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={() => toggleVerse(verse.numero)}
                style={[
                  styles.verse,
                  selected && { backgroundColor: colors.surface, borderLeftColor: colors.primary },
                ]}>
                <Text style={[styles.verseNumber, { color: colors.primary, fontSize: Math.max(fontSize - 4, 11) }]}>{verse.numero}</Text>
                <Text style={[styles.verseText, { color: colors.text, fontSize, lineHeight: Math.round(fontSize * 1.65) }]}>{verse.texto}</Text>
              </Pressable>
            );
          }}
          ListFooterComponent={
            <Text style={[styles.translation, { color: colors.mutedText }]}>Tradução do Padre Manuel de Matos Soares, 1956.</Text>
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.catalogHeader}>
        <Text style={[styles.title, { color: colors.text }]}>Bíblia Sagrada</Text>
        <Text style={[styles.catalogSubtitle, { color: colors.mutedText }]}>73 livros · disponível offline</Text>
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={19} color={colors.mutedText} />
          <TextInput accessibilityLabel="Pesquisar livros da Bíblia" placeholder="Pesquisar livro"
            placeholderTextColor={colors.mutedText} value={query} onChangeText={setQuery}
            style={[styles.searchInput, { color: colors.text, fontSize }]} />
        </View>
        <View style={styles.filters}>
          {(['Todos', 'Antigo Testamento', 'Novo Testamento'] as Filter[]).map((item) => {
            const active = item === filter;
            return (
              <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              }]}>
                <Text numberOfLines={1} style={{ color: active ? colors.background : colors.text,
                  fontSize: 11, fontWeight: '600' }}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <FlatList
        data={filteredBooks}
        keyExtractor={({ index }) => String(index)}
        contentContainerStyle={styles.bookList}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.mutedText }]}>Nenhum livro encontrado.</Text>}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => openBook(item.index)} style={({ pressed }) => [
            styles.book, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed,
          ]}>
            <View style={[styles.bookIcon, { backgroundColor: colors.background }]}>
              <Ionicons name="book-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.bookText}>
              <Text style={[styles.bookName, { color: colors.text, fontSize }]}>{item.name}</Text>
              <Text style={[styles.bookDetails, { color: colors.mutedText }]}>{item.chapterCount} {item.chapterCount === 1 ? 'capítulo' : 'capítulos'}</Text>
            </View>
            <Text style={[styles.abbreviation, { color: colors.mutedText }]}>{item.abbreviation}</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.mutedText} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, catalogHeader: { paddingHorizontal: 18, paddingTop: 14 },
  title: { fontFamily: 'serif', fontSize: 28, fontWeight: '700' },
  catalogSubtitle: { marginTop: 3, marginBottom: 14, fontSize: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 46, paddingHorizontal: 13, borderWidth: 1, borderRadius: 10 },
  searchInput: { flex: 1, height: 44 }, filters: { flexDirection: 'row', gap: 7, marginVertical: 13 },
  filter: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 34, paddingHorizontal: 6, borderWidth: 1, borderRadius: 8 },
  bookList: { paddingHorizontal: 18, paddingBottom: 24 },
  book: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 62, marginBottom: 7, paddingHorizontal: 12, borderWidth: 1, borderRadius: 11 },
  bookIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  bookText: { flex: 1 }, bookName: { fontFamily: 'serif', fontWeight: '700' },
  bookDetails: { marginTop: 2, fontSize: 10 }, abbreviation: { fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.6 }, empty: { paddingTop: 30, textAlign: 'center' },
  readerContent: { padding: 18, paddingBottom: 42 },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 13 },
  backText: { fontSize: 13, fontWeight: '700' }, readerHeader: { flexDirection: 'row', alignItems: 'center' },
  readerTitleArea: { flex: 1 }, readerTitle: { fontFamily: 'serif', fontSize: 25, fontWeight: '700' },
  readerSubtitle: { marginTop: 3, fontSize: 11 }, clearButton: { paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderRadius: 8 },
  clearText: { fontSize: 11, fontWeight: '700' }, chapters: { gap: 7, paddingVertical: 15 },
  chapterButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 10 },
  selectionHint: { marginTop: 8, marginBottom: 10, fontSize: 10, textAlign: 'center' },
  verse: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 8, paddingVertical: 9, borderLeftWidth: 3, borderLeftColor: 'transparent', borderRadius: 5 },
  verseNumber: { width: 29, paddingTop: 2, fontWeight: '800' }, verseText: { flex: 1, fontFamily: 'serif' },
  translation: { marginTop: 22, fontSize: 10, textAlign: 'center' },
});
