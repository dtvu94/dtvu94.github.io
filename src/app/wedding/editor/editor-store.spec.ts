import { TestBed } from '@angular/core/testing';
import { BOOK_STORAGE_KEY } from './editor-book';
import { encodeShare } from './editor-share';
import { EditorState, defaultEditorState } from './editor-state';
import { EditorStore } from './editor-store';

describe('EditorStore', () => {
  let now = 1_000_000;

  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  const make = () => TestBed.runInInjectionContext(() => new EditorStore());
  const layout = (store: EditorStore) => store.state().card.layout;
  const setLayout = (store: EditorStore, value: EditorState['card']['layout'], key = '') =>
    store.change((s) => ({ ...s, card: { ...s.card, layout: value } }), key);

  it('undoes and redoes design changes, but not where the editor is looking', () => {
    const store = make();
    const first = layout(store);
    setLayout(store, 'archFrame');
    setLayout(store, 'minimalLine');
    store.navigate((s) => ({ ...s, tab: 'content' }));
    expect(store.canUndo()).toBe(true);
    store.undo();
    expect(layout(store)).toBe('archFrame');
    // The tab stays where it is.
    expect(store.state().tab).toBe('content');
    store.undo();
    expect(layout(store)).toBe(first);
    expect(store.canUndo()).toBe(false);
    store.redo();
    store.redo();
    expect(layout(store)).toBe('minimalLine');
    expect(store.canRedo()).toBe(false);
    // A new change after an undo drops the redo trail.
    store.undo();
    setLayout(store, 'crestTop');
    expect(store.canRedo()).toBe(false);
  });

  it('merges rapid repeats of one control into a single step', () => {
    const store = make();
    const colour = (value: string) => store.change((s) => ({ ...s, palette: { ...s.palette, surface: value } }), 'palette.surface');
    const original = store.state().palette.surface;
    colour('#111111');
    now += 100;
    colour('#222222');
    now += 100;
    colour('#333333');
    now += 2000;
    colour('#444444');
    store.undo();
    expect(store.state().palette.surface).toBe('#333333');
    store.undo();
    expect(store.state().palette.surface).toBe(original);
  });

  it('keeps several designs: add, duplicate, switch, rename, remove', () => {
    const store = make();
    setLayout(store, 'archFrame');
    store.duplicate();
    expect(store.book().items).toHaveLength(2);
    expect(store.active().name).toBe('Phương án 1 (bản sao)');
    expect(layout(store)).toBe('archFrame');
    // Each design has its own history.
    expect(store.canUndo()).toBe(false);
    setLayout(store, 'minimalLine');
    store.rename('  Tối giản  ');
    expect(store.active().name).toBe('Tối giản');

    const first = store.book().items[0].id;
    store.open(first);
    expect(layout(store)).toBe('archFrame');
    store.open(store.book().items[1].id);
    expect(layout(store)).toBe('minimalLine');

    store.addBlank();
    expect(store.book().items).toHaveLength(3);
    expect(store.active().name).toBe('Phương án 3');
    expect(layout(store)).toBe(defaultEditorState().card.layout);

    store.removeActive();
    expect(store.book().items).toHaveLength(2);
    expect(store.active().name).toBe('Tối giản');

    store.flush();
    const saved = JSON.parse(localStorage.getItem(BOOK_STORAGE_KEY)!);
    expect(saved.items.map((i: { name: string }) => i.name)).toEqual(['Phương án 1', 'Tối giản']);
  });

  it('starts the last design over instead of removing it', () => {
    const store = make();
    setLayout(store, 'archFrame');
    store.removeActive();
    expect(store.book().items).toHaveLength(1);
    expect(layout(store)).toBe(defaultEditorState().card.layout);
  });

  it('opens a shared link as a new design', async () => {
    const store = make();
    const shared = { ...defaultEditorState(), card: { ...defaultEditorState().card, layout: 'laserCloud' as const } };
    await expect(store.importShared(`#d=${await encodeShare(shared, 'Mây')}`)).resolves.toBe(true);
    expect(store.book().items).toHaveLength(2);
    expect(store.active().name).toBe('Mây (được chia sẻ)');
    expect(layout(store)).toBe('laserCloud');
    await expect(store.importShared('#d=garbage')).resolves.toBe(false);
    await expect(store.importShared('#other')).resolves.toBe(false);
    const url = await store.shareUrl('https://dtvu94.github.io');
    expect(url).toMatch(/^https:\/\/dtvu94\.github\.io\/wedding\/editor#d=[zj]/);
  });
});
