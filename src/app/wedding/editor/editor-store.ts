import { Injectable, OnDestroy, computed, effect, signal } from '@angular/core';
import { DesignBook, DesignEntry, loadBook, newEntry, nextName, saveBook } from './editor-book';
import { SHARE_HASH, decodeShare, encodeShare } from './editor-share';
import { EditorState, defaultEditorState, saveEditorState } from './editor-state';

/** Rapid changes of one control (a colour drag, typing, a sticker drag) undo as one step. */
const MERGE_MS = 800;
const HISTORY = 100;

/** Where the editor is looking: not part of a design, so undo leaves it alone. */
type View = Pick<EditorState, 'tab' | 'envelopeFace' | 'overview'>;

function viewOf(state: EditorState): View {
  return { tab: state.tab, envelopeFace: state.envelopeFace, overview: state.overview };
}

/**
 * The editor's state and everything around it: undo / redo, the book of
 * designs (phương án), share links, and saving to localStorage shortly
 * after each change. One per editor page.
 */
@Injectable()
export class EditorStore implements OnDestroy {
  readonly book = signal<DesignBook>(loadBook());
  readonly state = signal<EditorState>(this.entry(this.book().active).state);
  readonly active = computed<DesignEntry>(() => this.entry(this.book().active));
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  private past: EditorState[] = [];
  private future: EditorState[] = [];
  private lastKey = '';
  private lastAt = 0;
  private saveTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const state = this.state();
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.save(state), 250);
    });
  }

  ngOnDestroy(): void {
    this.flush();
  }

  // ── changes and history ─────────────────────────────────────────────────

  /** A change to the design, remembered for undo; `key` merges rapid repeats of one control. */
  change(update: (state: EditorState) => EditorState, key = ''): void {
    const before = this.state();
    const now = Date.now();
    if (!key || key !== this.lastKey || now - this.lastAt > MERGE_MS) {
      this.past.push(before);
      if (this.past.length > HISTORY) {
        this.past.shift();
      }
    }
    this.lastKey = key;
    this.lastAt = now;
    this.future = [];
    this.state.set(update(before));
    this.syncHistory();
  }

  /** A change of view (tab, side, overview): not a step to undo. */
  navigate(update: (state: EditorState) => EditorState): void {
    this.state.update(update);
  }

  undo(): void {
    const previous = this.past.pop();
    if (previous) {
      const current = this.state();
      this.future.push(current);
      this.state.set({ ...previous, ...viewOf(current) });
      this.lastKey = '';
      this.syncHistory();
    }
  }

  redo(): void {
    const next = this.future.pop();
    if (next) {
      const current = this.state();
      this.past.push(current);
      this.state.set({ ...next, ...viewOf(current) });
      this.lastKey = '';
      this.syncHistory();
    }
  }

  private syncHistory(): void {
    this.canUndo.set(this.past.length > 0);
    this.canRedo.set(this.future.length > 0);
  }

  private clearHistory(): void {
    this.past = [];
    this.future = [];
    this.lastKey = '';
    this.syncHistory();
  }

  // ── the book of designs ─────────────────────────────────────────────────

  private entry(id: string): DesignEntry {
    const book = this.book();
    return book.items.find((item) => item.id === id) ?? book.items[0];
  }

  /** Opens another design (the current one is saved first). */
  open(id: string): void {
    if (id === this.book().active || !this.book().items.some((item) => item.id === id)) {
      return;
    }
    this.flush();
    const view = viewOf(this.state());
    this.book.update((book) => ({ ...book, active: id }));
    this.state.set({ ...this.entry(id).state, ...view });
    this.clearHistory();
  }

  /** Adds a design and opens it. */
  add(state: EditorState, name = nextName(this.book())): void {
    this.flush();
    const entry = newEntry(name, state);
    this.book.update((book) => ({ active: entry.id, items: [...book.items, entry] }));
    this.state.set(state);
    this.clearHistory();
    this.save(state);
  }

  duplicate(): void {
    this.add({ ...this.state(), overview: false }, `${this.active().name} (bản sao)`);
  }

  /** A fresh design with the same wedding facts. */
  addBlank(): void {
    this.add({ ...defaultEditorState(), mode: this.state().mode, content: { ...this.state().content } });
  }

  rename(name: string): void {
    const clean = name.trim().slice(0, 60);
    if (clean) {
      this.book.update((book) => ({ ...book, items: book.items.map((item) => (item.id === book.active ? { ...item, name: clean } : item)) }));
      saveBook(this.book());
    }
  }

  /** Removes the open design and opens the next; the last one left is started over instead. */
  removeActive(): void {
    const book = this.book();
    if (book.items.length === 1) {
      this.change(() => defaultEditorState());
      return;
    }
    const index = book.items.findIndex((item) => item.id === book.active);
    const items = book.items.filter((item) => item.id !== book.active);
    const next = items[Math.min(index, items.length - 1)];
    clearTimeout(this.saveTimer);
    this.book.set({ active: next.id, items });
    this.state.set({ ...next.state, ...viewOf(this.state()) });
    this.clearHistory();
    saveBook(this.book());
  }

  // ── share links ─────────────────────────────────────────────────────────

  async shareUrl(origin: string): Promise<string> {
    return `${origin}/wedding/editor${SHARE_HASH}${await encodeShare(this.state(), this.active().name)}`;
  }

  /** Opens a shared design from a #d=… hash as a new entry; false when the link is damaged. */
  async importShared(hash: string): Promise<boolean> {
    if (!hash.startsWith(SHARE_HASH)) {
      return false;
    }
    const shared = await decodeShare(hash.slice(SHARE_HASH.length));
    if (!shared) {
      return false;
    }
    this.add({ ...shared.state, tab: 'card', overview: true }, `${shared.name} (được chia sẻ)`);
    return true;
  }

  // ── saving ──────────────────────────────────────────────────────────────

  /** Saves now (leaving the page, switching designs). */
  flush(): void {
    clearTimeout(this.saveTimer);
    this.save(this.state());
  }

  private save(state: EditorState): void {
    const now = Date.now();
    this.book.update((book) => ({
      ...book,
      items: book.items.map((item) => (item.id === book.active ? { ...item, state, updated: now } : item)),
    }));
    saveBook(this.book());
    saveEditorState(state);
  }
}
