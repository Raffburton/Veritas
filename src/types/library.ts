export type ContentSource = 'bible' | 'liturgy';

export type ContentReference = {
  source: ContentSource;
  id: string;
  title: string;
  location: string;
  excerpt: string;
  book?: string;
  chapter?: number;
  verseStart?: number;
  verseEnd?: number;
  date?: string;
  section?: string;
};

export type LinkedNote = {
  id: string;
  body: string;
  reference: ContentReference;
  createdAt: string;
  updatedAt: string;
};

export type SavedReading = {
  id: string;
  reference: ContentReference;
  createdAt: string;
};
