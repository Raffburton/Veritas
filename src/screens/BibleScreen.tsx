import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';

const BOOKS = [
  ['Gênesis', 'Gn', 'Antigo Testamento'], ['Êxodo', 'Ex', 'Antigo Testamento'],
  ['Levítico', 'Lv', 'Antigo Testamento'], ['Números', 'Nm', 'Antigo Testamento'],
  ['Deuteronômio', 'Dt', 'Antigo Testamento'], ['Josué', 'Js', 'Antigo Testamento'],
  ['Salmos', 'Sl', 'Antigo Testamento'], ['Isaías', 'Is', 'Antigo Testamento'],
  ['Mateus', 'Mt', 'Novo Testamento'], ['Marcos', 'Mc', 'Novo Testamento'],
  ['Lucas', 'Lc', 'Novo Testamento'], ['João', 'Jo', 'Novo Testamento'],
  ['Atos dos Apóstolos', 'At', 'Novo Testamento'], ['Romanos', 'Rm', 'Novo Testamento'],
  ['Apocalipse', 'Ap', 'Novo Testamento'],
] as const;

type Filter = 'Todos' | 'Antigo Testamento' | 'Novo Testamento';

export function BibleScreen() {
  const { colors, fontSize } = useTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Todos');
  const books = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    return BOOKS.filter(([name, abbreviation, testament]) =>
      (filter === 'Todos' || testament === filter) &&
      (!normalized || name.toLocaleLowerCase('pt-BR').includes(normalized) ||
        abbreviation.toLocaleLowerCase('pt-BR').includes(normalized)),
    );
  }, [filter, query]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Bíblia</Text>
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={19} color={colors.mutedText} />
          <TextInput
            accessibilityLabel="Pesquisar livros da Bíblia"
            placeholder="Pesquisar na Bíblia"
            placeholderTextColor={colors.mutedText}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: colors.text, fontSize }]}
          />
        </View>
        <View style={styles.filters}>
          {(['Todos', 'Antigo Testamento', 'Novo Testamento'] as Filter[]).map((item) => {
            const active = item === filter;
            return (
              <Pressable key={item} onPress={() => setFilter(item)} style={[
                styles.filter,
                { backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border },
              ]}>
                <Text numberOfLines={1} style={{
                  color: active ? colors.background : colors.text, fontSize: 11, fontWeight: '600',
                }}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <FlatList
        data={books}
        keyExtractor={([name]) => name}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.mutedText }]}>Nenhum livro encontrado.</Text>}
        renderItem={({ item: [name, abbreviation] }) => (
          <Pressable accessibilityRole="button" style={({ pressed }) => [
            styles.book, { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}>
            <Ionicons name="book-outline" size={18} color={colors.primary} />
            <Text style={[styles.bookName, { color: colors.text, fontSize }]}>{name}</Text>
            <Text style={[styles.abbreviation, { color: colors.mutedText }]}>{abbreviation}</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.mutedText} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 18, paddingTop: 14 },
  title: { marginBottom: 14, fontFamily: 'serif', fontSize: 28, fontWeight: '700' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 46,
    paddingHorizontal: 13, borderWidth: 1, borderRadius: 10 },
  searchInput: { flex: 1, height: 44 }, filters: { flexDirection: 'row', gap: 7, marginVertical: 13 },
  filter: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 34,
    paddingHorizontal: 6, borderWidth: 1, borderRadius: 8 },
  list: { paddingHorizontal: 18, paddingBottom: 24 },
  book: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 52,
    marginBottom: 7, paddingHorizontal: 14, borderWidth: 1, borderRadius: 10 },
  bookName: { flex: 1, fontWeight: '600' }, abbreviation: { fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.62 }, empty: { paddingTop: 30, textAlign: 'center' },
});
