import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { ContentReference, LinkedNote, NoteFolder, SavedReading } from '../types/library';

const LIBRARY_KEY = '@veritas:study-library';

type LibraryState = {
  notes: LinkedNote[];
  folders: NoteFolder[];
  savedReadings: SavedReading[];
};

type LibraryContextValue = LibraryState & {
  ready: boolean;
  addNote: (reference: ContentReference, body: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  createFolder: (name: string) => Promise<string | null>;
  deleteFolder: (id: string) => Promise<void>;
  moveNoteToFolder: (noteId: string, folderId?: string) => Promise<void>;
  toggleSavedReading: (reference: ContentReference) => Promise<void>;
  removeSavedReading: (id: string) => Promise<void>;
  isSaved: (referenceId: string) => boolean;
};

const initialState: LibraryState = { notes: [], folders: [], savedReadings: [] };
const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<LibraryState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadLibrary() {
      try {
        const stored = await AsyncStorage.getItem(LIBRARY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<LibraryState>;
          setLibrary({
            notes: Array.isArray(parsed.notes) ? parsed.notes : [],
            folders: Array.isArray(parsed.folders) ? parsed.folders : [],
            savedReadings: Array.isArray(parsed.savedReadings) ? parsed.savedReadings : [],
          });
        }
      } catch {
        setLibrary(initialState);
      } finally {
        setReady(true);
      }
    }
    void loadLibrary();
  }, []);

  useEffect(() => {
    if (!ready) return;
    void AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(library)).catch(() => undefined);
  }, [library, ready]);

  const updateLibrary = useCallback(async (updater: (current: LibraryState) => LibraryState) => {
    setLibrary(updater);
  }, []);

  const addNote = useCallback(async (reference: ContentReference, body: string) => {
    const cleanBody = body.trim();
    if (!cleanBody) return;
    const timestamp = new Date().toISOString();
    await updateLibrary((current) => ({
      ...current,
      notes: [{ id: createId('note'), body: cleanBody, reference, createdAt: timestamp, updatedAt: timestamp }, ...current.notes],
    }));
  }, [updateLibrary]);

  const deleteNote = useCallback(async (id: string) => {
    await updateLibrary((current) => ({ ...current, notes: current.notes.filter((note) => note.id !== id) }));
  }, [updateLibrary]);

  const createFolder = useCallback(async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return null;
    const id = createId('folder');
    await updateLibrary((current) => ({
      ...current,
      folders: [...current.folders, { id, name: cleanName, createdAt: new Date().toISOString() }],
    }));
    return id;
  }, [updateLibrary]);

  const deleteFolder = useCallback(async (id: string) => {
    await updateLibrary((current) => ({
      ...current,
      folders: current.folders.filter((folder) => folder.id !== id),
      notes: current.notes.map((note) => note.folderId === id ? { ...note, folderId: undefined } : note),
    }));
  }, [updateLibrary]);

  const moveNoteToFolder = useCallback(async (noteId: string, folderId?: string) => {
    await updateLibrary((current) => ({
      ...current,
      notes: current.notes.map((note) => note.id === noteId
        ? { ...note, folderId, updatedAt: new Date().toISOString() }
        : note),
    }));
  }, [updateLibrary]);

  const toggleSavedReading = useCallback(async (reference: ContentReference) => {
    await updateLibrary((current) => {
      const existing = current.savedReadings.find((item) => item.reference.id === reference.id);
      return {
        ...current,
        savedReadings: existing
          ? current.savedReadings.filter((item) => item.id !== existing.id)
          : [{ id: createId('saved'), reference, createdAt: new Date().toISOString() }, ...current.savedReadings],
      };
    });
  }, [updateLibrary]);

  const removeSavedReading = useCallback(async (id: string) => {
    await updateLibrary((current) => ({
      ...current,
      savedReadings: current.savedReadings.filter((item) => item.id !== id),
    }));
  }, [updateLibrary]);

  const savedIds = useMemo(() => new Set(library.savedReadings.map((item) => item.reference.id)), [library.savedReadings]);
  const value = useMemo<LibraryContextValue>(() => ({
    ...library,
    ready,
    addNote,
    deleteNote,
    createFolder,
    deleteFolder,
    moveNoteToFolder,
    toggleSavedReading,
    removeSavedReading,
    isSaved: (referenceId) => savedIds.has(referenceId),
  }), [addNote, createFolder, deleteFolder, deleteNote, library, moveNoteToFolder, ready, removeSavedReading, savedIds, toggleSavedReading]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary deve ser usado dentro de LibraryProvider.');
  return context;
}
