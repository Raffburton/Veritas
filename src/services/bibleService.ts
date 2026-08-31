import bibleJson from '../data/BibleData.json';

export type BibleVerse = {
  numero: number;
  texto: string;
};

export type BibleChapter = {
  capitulo: number;
  versiculos: BibleVerse[];
};

export type BibleBook = {
  livro: string;
  capitulos: BibleChapter[];
};

export type BibleBookSummary = {
  index: number;
  name: string;
  abbreviation: string;
  testament: 'Antigo Testamento' | 'Novo Testamento';
  chapterCount: number;
};

const bible = bibleJson as BibleBook[];
const abbreviations = [
  'Gn', 'Ex', 'Lv', 'Nm', 'Dt', 'Js', 'Jz', 'Rt', '1Sm', '2Sm', '1Rs', '2Rs',
  '1Cr', '2Cr', 'Esd', 'Ne', 'Tb', 'Jt', 'Est', '1Mc', '2Mc', 'Jó', 'Sl', 'Pr',
  'Ecl', 'Ct', 'Sb', 'Eclo', 'Is', 'Jr', 'Lm', 'Br', 'Ez', 'Dn', 'Os', 'Jl',
  'Am', 'Ab', 'Jn', 'Mq', 'Na', 'Hab', 'Sf', 'Ag', 'Zc', 'Ml', 'Mt', 'Mc', 'Lc',
  'Jo', 'At', 'Rm', '1Cor', '2Cor', 'Gl', 'Ef', 'Fl', 'Cl', '1Ts', '2Ts', '1Tm',
  '2Tm', 'Tt', 'Fm', 'Hb', 'Tg', '1Pd', '2Pd', '1Jo', '2Jo', '3Jo', 'Jd', 'Ap',
];

export const bibleBooks: BibleBookSummary[] = bible.map((book, index) => ({
  index,
  name: book.livro,
  abbreviation: abbreviations[index] ?? book.livro.slice(0, 3),
  testament: index < 46 ? 'Antigo Testamento' : 'Novo Testamento',
  chapterCount: book.capitulos.length,
}));

export function getBibleBook(index: number): BibleBook | null {
  return bible[index] ?? null;
}

export function getBibleChapter(bookIndex: number, chapterNumber: number): BibleChapter | null {
  const book = getBibleBook(bookIndex);
  return book?.capitulos.find((chapter) => chapter.capitulo === chapterNumber) ?? null;
}
