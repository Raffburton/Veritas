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
const PSALMS_BOOK_INDEX = 22;

function withChapterNumber(chapter: BibleChapter, capitulo: number): BibleChapter {
  return { capitulo, versiculos: chapter.versiculos.map((verse) => ({ ...verse })) };
}

export function getHebrewPsalmChapterNumbers(sourceChapterNumber: number): number[] {
  if (sourceChapterNumber >= 1 && sourceChapterNumber <= 8) return [sourceChapterNumber];
  if (sourceChapterNumber === 9) return [9, 10];
  if (sourceChapterNumber >= 10 && sourceChapterNumber <= 146) return [sourceChapterNumber + 1];
  if (sourceChapterNumber === 147) return [146, 147];
  if (sourceChapterNumber >= 148 && sourceChapterNumber <= 150) return [sourceChapterNumber];
  return [];
}

function buildMasoreticPsalms(source: BibleBook): BibleBook {
  const sourceChapter = (number: number) => source.capitulos[number - 1];
  const chapters: BibleChapter[] = [];

  for (let number = 1; number <= 8; number += 1) {
    chapters.push(withChapterNumber(sourceChapter(number), number));
  }

  const psalmNine = sourceChapter(9).versiculos;
  chapters.push({
    capitulo: 9,
    versiculos: psalmNine.filter((verse) => verse.numero <= 21).map((verse) => ({ ...verse })),
  });
  chapters.push({
    capitulo: 10,
    versiculos: psalmNine
      .filter((verse) => verse.numero >= 22)
      .map((verse) => ({ ...verse, numero: verse.numero - 21 })),
  });

  for (let number = 11; number <= 113; number += 1) {
    chapters.push(withChapterNumber(sourceChapter(number - 1), number));
  }

  const psalmOneHundredThirteen = sourceChapter(113).versiculos;
  chapters.push({
    capitulo: 114,
    versiculos: psalmOneHundredThirteen.filter((verse) => verse.numero <= 8).map((verse) => ({ ...verse })),
  });
  chapters.push({
    capitulo: 115,
    versiculos: psalmOneHundredThirteen
      .filter((verse) => verse.numero >= 9)
      .map((verse) => ({ ...verse, numero: verse.numero - 8 })),
  });
  chapters.push({
    capitulo: 116,
    versiculos: [...sourceChapter(114).versiculos, ...sourceChapter(115).versiculos].map((verse) => ({ ...verse })),
  });

  for (let number = 117; number <= 146; number += 1) {
    chapters.push(withChapterNumber(sourceChapter(number - 1), number));
  }

  chapters.push({
    capitulo: 147,
    versiculos: [...sourceChapter(146).versiculos, ...sourceChapter(147).versiculos].map((verse) => ({ ...verse })),
  });

  for (let number = 148; number <= 150; number += 1) {
    chapters.push(withChapterNumber(sourceChapter(number), number));
  }

  return { ...source, capitulos: chapters };
}

const masoreticPsalms = buildMasoreticPsalms(bible[PSALMS_BOOK_INDEX]);
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
  if (index === PSALMS_BOOK_INDEX) return masoreticPsalms;
  return bible[index] ?? null;
}

export function getBibleChapter(bookIndex: number, chapterNumber: number): BibleChapter | null {
  const book = getBibleBook(bookIndex);
  return book?.capitulos.find((chapter) => chapter.capitulo === chapterNumber) ?? null;
}
