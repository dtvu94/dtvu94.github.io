import { EDITOR_STORAGE_KEY, EditorState, defaultEditorState, restoreEditorState } from './editor-state';

/**
 * Phương án — several named designs side by side in this browser. The book
 * keeps every design's state; the open one is also the editor's own state.
 */
export interface DesignEntry {
  id: string;
  name: string;
  /** Last change, ms since epoch. */
  updated: number;
  state: EditorState;
}

export interface DesignBook {
  active: string;
  items: DesignEntry[];
}

export const BOOK_STORAGE_KEY = 'wedding-editor-designs-v1';

let seq = 0;

export function newDesignId(): string {
  seq += 1;
  return `d${Date.now().toString(36)}${seq}`;
}

export function newEntry(name: string, state: EditorState): DesignEntry {
  return { id: newDesignId(), name, updated: Date.now(), state };
}

/** "Phương án 3": the first number not taken. */
export function nextName(book: DesignBook, stem = 'Phương án'): string {
  const taken = new Set(book.items.map((item) => item.name));
  let n = book.items.length + 1;
  while (taken.has(`${stem} ${n}`)) {
    n += 1;
  }
  return `${stem} ${n}`;
}

/** A saved book, each design checked like a single saved state; else one design from `fallback`. */
export function restoreBook(raw: string | null, fallback: () => EditorState): DesignBook {
  try {
    const saved = raw ? (JSON.parse(raw) as Partial<DesignBook>) : null;
    if (saved && Array.isArray(saved.items)) {
      const items: DesignEntry[] = saved.items
        .filter((item): item is DesignEntry => !!item && typeof item.id === 'string' && typeof item.name === 'string')
        .map((item) => ({
          id: item.id,
          name: item.name.slice(0, 60) || 'Phương án',
          updated: typeof item.updated === 'number' ? item.updated : 0,
          state: restoreEditorState(JSON.stringify(item.state ?? null)),
        }));
      if (items.length) {
        const active = items.some((item) => item.id === saved.active) ? (saved.active as string) : items[0].id;
        return { active, items };
      }
    }
  } catch {
    // Unreadable: start a new book.
  }
  const first = newEntry('Phương án 1', fallback());
  return { active: first.id, items: [first] };
}

/** The book from localStorage; a design saved before books existed becomes its first entry. */
export function loadBook(): DesignBook {
  let raw: string | null = null;
  let single: string | null = null;
  try {
    raw = localStorage.getItem(BOOK_STORAGE_KEY);
    single = localStorage.getItem(EDITOR_STORAGE_KEY);
  } catch {
    // No storage: an in-memory book.
  }
  return restoreBook(raw, () => restoreEditorState(single));
}

export function saveBook(book: DesignBook): void {
  try {
    localStorage.setItem(BOOK_STORAGE_KEY, JSON.stringify(book));
  } catch {
    // Storage full or blocked: the book lives for this visit.
  }
}

/** Every photo any design still uses (to forget the others). */
export function photosInUse(book: DesignBook): Set<string> {
  const used = new Set<string>();
  for (const { state } of book.items) {
    for (const sticker of state.stickers) {
      if (sticker.photo) {
        used.add(sticker.photo);
      }
    }
    if (state.directions.mapPhoto) {
      used.add(state.directions.mapPhoto);
    }
  }
  return used;
}

export { defaultEditorState };
