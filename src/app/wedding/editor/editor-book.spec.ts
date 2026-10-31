import { BOOK_STORAGE_KEY, loadBook, nextName, photosInUse, restoreBook } from './editor-book';
import { decodeShare, encodeShare } from './editor-share';
import { EDITOR_STORAGE_KEY, defaultEditorState } from './editor-state';
import { snapPoint } from './editor-stage.component';

describe('design book (phương án)', () => {
  afterEach(() => localStorage.clear());

  it('starts from the design saved before books existed', () => {
    localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify({ ...defaultEditorState(), mode: 'online' }));
    const book = loadBook();
    expect(book.items).toHaveLength(1);
    expect(book.items[0].name).toBe('Phương án 1');
    expect(book.items[0].state.mode).toBe('online');
    expect(book.active).toBe(book.items[0].id);
  });

  it('restores a saved book, checking every design and the open one', () => {
    const a = { id: 'a', name: 'Đỏ', updated: 1, state: defaultEditorState() };
    const b = { id: 'b', name: 'Xanh', updated: 2, state: { ...defaultEditorState(), card: { layout: 'nope' } } };
    localStorage.setItem(BOOK_STORAGE_KEY, JSON.stringify({ active: 'zzz', items: [a, b, null, { id: 3 }] }));
    const book = loadBook();
    expect(book.items.map((i) => i.name)).toEqual(['Đỏ', 'Xanh']);
    // An unknown open id falls back to the first design.
    expect(book.active).toBe('a');
    // Odd fields fall back field by field.
    expect(book.items[1].state.card.layout).toBe(defaultEditorState().card.layout);
    expect(restoreBook('{oops', defaultEditorState).items).toHaveLength(1);
  });

  it('names new designs after the first free number', () => {
    const book = restoreBook(null, defaultEditorState);
    expect(nextName(book)).toBe('Phương án 2');
    book.items.push({ ...book.items[0], id: 'x', name: 'Phương án 2' });
    expect(nextName(book)).toBe('Phương án 3');
  });

  it('lists the photos any design still uses', () => {
    const state = defaultEditorState();
    const book = restoreBook(null, () => ({
      ...state,
      directions: { ...state.directions, mapPhoto: 'map1' },
      stickers: [{ id: 's', face: 'card', kind: 'photo', x: 0.5, y: 0.5, size: 100, rotate: 0, color: 'accent', photo: 'p1' }],
    }));
    expect([...photosInUse(book)].sort()).toEqual(['map1', 'p1']);
  });
});

describe('share links', () => {
  it('round-trips a design, leaving this browser’s photos behind', async () => {
    const state = {
      ...defaultEditorState(),
      mode: 'online' as const,
      content: { ...defaultEditorState().content, groom: 'Minh Anh' },
      directions: { ...defaultEditorState().directions, map: 'image' as const, mapPhoto: 'm1' },
      stickers: [{ id: 's', face: 'card' as const, kind: 'photo' as const, x: 0.3, y: 0.4, size: 100, rotate: 5, color: 'accent' as const, photo: 'p1', frame: 'arch' as const }],
    };
    const payload = await encodeShare(state, 'Phương án đẹp');
    expect(payload).toMatch(/^[zj][A-Za-z0-9_-]+$/);
    const shared = await decodeShare(payload);
    expect(shared?.name).toBe('Phương án đẹp');
    expect(shared?.state.mode).toBe('online');
    expect(shared?.state.content.groom).toBe('Minh Anh');
    expect(shared?.state.stickers[0]).toEqual(expect.objectContaining({ kind: 'photo', frame: 'arch', x: 0.3 }));
    expect(shared?.state.stickers[0].photo).toBeUndefined();
    // An uploaded map can't travel either: the card falls back to the sketch.
    expect(shared?.state.directions).toEqual(expect.objectContaining({ map: 'sketch', mapPhoto: '' }));
  });

  it('turns a damaged link into nothing', async () => {
    await expect(decodeShare('x123')).resolves.toBeNull();
    await expect(decodeShare('j!!!')).resolves.toBeNull();
    await expect(decodeShare('j' + btoa('{"name":1}'))).resolves.toBeNull();
  });
});

describe('snapping', () => {
  it('snaps to the centre lines and to other stickers, with guides', () => {
    expect(snapPoint(0.505, 0.3, [], 0.02, 0.02)).toEqual({ x: 0.5, y: 0.3, guideX: 0.5, guideY: null });
    const snapped = snapPoint(0.31, 0.71, [{ x: 0.3, y: 0.2 }], 0.02, 0.02);
    expect(snapped.guideX).toBe(0.3);
    expect(snapped.x).toBe(0.3);
    // No line nearby: the 5 % grid.
    expect(snapped.y).toBe(0.7);
    expect(snapped.guideY).toBeNull();
    // Far from everything: left alone.
    expect(snapPoint(0.123, 0.876, [], 0.002, 0.002)).toEqual({ x: 0.123, y: 0.876, guideX: null, guideY: null });
  });
});
