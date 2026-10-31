import { INVITATION_DESIGNS, getDesignById } from '../data/designs';
import { buildWording } from '../data/invitation-wording';
import { WEDDING_CONFIG } from '../data/wedding-config';
import { envelopeFront } from '../envelope/envelope.component';
import {
  EDITOR_STORAGE_KEY,
  defaultContent,
  defaultEditorState,
  editorConfig,
  loadEditorState,
  lookFromDesign,
  restoreEditorState,
  saveEditorState,
  startFrom,
  toDesign,
} from './editor-state';

describe('editor state', () => {
  it('writes the default facts back exactly as wedding-config.ts has them', () => {
    const config = editorConfig(defaultContent());
    for (const key of ['groom', 'bride', 'parents', 'isoDate', 'startTime', 'timeText', 'weekdayText', 'dateText', 'hall', 'venue'] as const) {
      expect(config[key]).toEqual(WEDDING_CONFIG[key]);
    }
  });

  it('localizes a new date and time in every language', () => {
    const config = editorConfig({ ...defaultContent(), date: '2027-01-02', time: '09:30' });
    expect(config.dateText).toEqual({ vi: 'ngày 02 tháng 01 năm 2027', en: 'January 2nd, 2027', th: 'ที่ 2 มกราคม พ.ศ. 2570' });
    expect(config.weekdayText).toEqual({ vi: 'Thứ Bảy', en: 'Saturday', th: 'วันเสาร์' });
    expect(config.timeText).toEqual({ vi: '09h30', en: '9:30 AM', th: '09:30 น.' });
    expect(config.endTime).toBe('12:30');
    // An impossible date keeps the configured one.
    expect(editorConfig({ ...defaultContent(), date: '2027-02-30' }).isoDate).toBe(WEDDING_CONFIG.isoDate);
  });

  it('prints typed names, parents and venue on the copy', () => {
    const content = { ...defaultContent(), groom: 'Minh Anh', bride: 'Lan Chi', groomFather: 'Lê Văn A', venueName: 'Nhà hàng Hoa Sen' };
    const copy = buildWording(editorConfig(content), 'vi');
    expect(copy.coupleLine).toBe('Minh Anh & Lan Chi');
    expect(copy.monogram).toBe('A & C');
    expect(copy.parents[0].names[0]).toBe('Ông Lê Văn A');
    expect(copy.venueLines).toContain('Nhà hàng Hoa Sen');
    // A venue typed in Vietnamese reads the same in English.
    expect(buildWording(editorConfig(content), 'en').venueLines).toContain('Nhà hàng Hoa Sen');
  });

  it('round-trips every ready-made design through the editor pieces', () => {
    for (const design of INVITATION_DESIGNS) {
      const state = { ...defaultEditorState(), ...lookFromDesign(design) };
      const made = toDesign(state);
      expect(made.palette).toEqual(design.palette);
      expect(made.layout).toBe(design.layout);
      expect(made.relief).toEqual(design.relief);
      expect(envelopeFront(made.envelope)).toEqual(envelopeFront(design.envelope));
      expect(made.envelope.roses).toEqual(design.envelope.roses);
      expect(made.envelope.flap).toBe(design.envelope.flap);
    }
  });

  it('takes on another look but keeps the facts and stickers', () => {
    const state = {
      ...defaultEditorState(),
      content: { ...defaultContent(), groom: 'Khoa' },
      stickers: [{ id: 'a', face: 'card' as const, kind: 'heart' as const, x: 0.5, y: 0.5, size: 40, rotate: 0, color: 'accent' as const }],
    };
    const next = startFrom(state, getDesignById('vn-luc-binh')!);
    expect(next.from).toBe('vn-luc-binh');
    expect(next.card.layout).toBe('laserCloud');
    expect(next.content.groom).toBe('Khoa');
    expect(next.stickers).toHaveLength(1);
  });

  it('restores a saved state, dropping anything malformed', () => {
    expect(restoreEditorState(null)).toEqual(defaultEditorState());
    expect(restoreEditorState('{not json')).toEqual(defaultEditorState());
    expect(restoreEditorState(JSON.stringify({ v: 2 }))).toEqual(defaultEditorState());
    const saved = {
      ...defaultEditorState(),
      mode: 'online',
      card: { ...defaultEditorState().card, layout: 'archFrame', shape: 42 },
      stickers: [
        { id: 'ok', face: 'card', kind: 'logo', x: 1.4, y: 0.2, size: 999, rotate: 10, color: 'nope' },
        { id: 'bad', face: 'roof', kind: 'logo', x: 0, y: 0 },
        'junk',
      ],
    };
    const state = restoreEditorState(JSON.stringify(saved));
    expect(state.mode).toBe('online');
    expect(state.card.layout).toBe('archFrame');
    // Wrong type: the default stays.
    expect(state.card.shape).toBe(defaultEditorState().card.shape);
    expect(state.stickers).toEqual([{ id: 'ok', face: 'card', kind: 'logo', x: 1, y: 0.2, size: 320, rotate: 10, color: 'accent' }]);
  });

  it('saves to and loads from localStorage', () => {
    localStorage.removeItem(EDITOR_STORAGE_KEY);
    expect(loadEditorState()).toEqual(defaultEditorState());
    const state = { ...defaultEditorState(), tab: 'card' as const };
    saveEditorState(state);
    expect(loadEditorState()).toEqual(state);
    localStorage.removeItem(EDITOR_STORAGE_KEY);
  });
});
