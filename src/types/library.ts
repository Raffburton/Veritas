export type ContentSource = 'bible' | 'liturgy';

export type ContentReference = {
  source: ContentSource;
  id: string;
  title: string;
  location: string;
  excerpt: string;
  book?: string;
  bookIndex?: number;
  chapter?: number;
  verseStart?: number;
  verseEnd?: number;
  verseNumbers?: number[];
  date?: string;
  section?: string;
};

export type LinkedNote = {
  id: string;
  body: string;
  reference: ContentReference;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
};

export type NoteFolder = {
  id: string;
  name: string;
  createdAt: string;
};

export type SavedReading = {
  id: string;
  reference: ContentReference;
  createdAt: string;
};
