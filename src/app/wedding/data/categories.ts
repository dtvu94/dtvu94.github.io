import { CardForm, DesignStyle, FormMeta, StyleMeta } from './wedding.types';

/** Kiểu thiệp — first filter row, in display order. */
export const CARD_FORMS: FormMeta[] = [
  { id: 'diecut', labels: { vi: 'Cắt bế', en: 'Die-cut', th: 'ไดคัท' } },
  { id: 'letterpress', labels: { vi: 'Dập chìm nổi', en: 'Letterpress & Emboss', th: 'ปั๊มนูน-ปั๊มจม' } },
  { id: 'lasercut', labels: { vi: 'Cắt laser', en: 'Laser-cut', th: 'ฉลุเลเซอร์' } },
  { id: 'folded', labels: { vi: 'Thiệp gấp', en: 'Folded', th: 'การ์ดพับ' } },
  { id: 'popup', labels: { vi: 'Pop-up 3D', en: 'Pop-up 3D', th: 'ป๊อปอัป 3D' } },
  { id: 'pocket', labels: { vi: 'Thiệp rút & túi', en: 'Pockets & Sliders', th: 'ซองสอด & สไลด์' } },
  { id: 'passport', labels: { vi: 'Hộ chiếu & vé', en: 'Passport & Ticket', th: 'พาสปอร์ต & ตั๋ว' } },
];

/** Phong cách — second filter row, in display order. */
export const DESIGN_STYLES: StyleMeta[] = [
  { id: 'modern', labels: { vi: 'Hiện đại', en: 'Modern', th: 'โมเดิร์น' } },
  { id: 'minimalist', labels: { vi: 'Tối giản', en: 'Minimalist', th: 'มินิมอล' } },
  { id: 'vintage', labels: { vi: 'Vintage', en: 'Vintage', th: 'วินเทจ' } },
  { id: 'classic', labels: { vi: 'Cổ điển', en: 'Classic', th: 'คลาสสิก' } },
  { id: 'floral', labels: { vi: 'Hoa lá', en: 'Floral', th: 'ลายดอกไม้' } },
  { id: 'vietnamese', labels: { vi: 'Truyền thống', en: 'Traditional', th: 'ดั้งเดิม' } },
  { id: 'rustic', labels: { vi: 'Mộc mạc', en: 'Rustic', th: 'รัสติก' } },
  { id: 'artdeco', labels: { vi: 'Art Deco', en: 'Art Deco', th: 'อาร์ตเดโค' } },
];

const FORM_LABELS = new Map(CARD_FORMS.map((form) => [form.id, form.labels] as const));
const STYLE_LABELS = new Map(DESIGN_STYLES.map((style) => [style.id, style.labels] as const));

export function formLabel(form: CardForm, lang: keyof FormMeta['labels']): string {
  return FORM_LABELS.get(form)?.[lang] ?? form;
}

export function styleLabel(style: DesignStyle, lang: keyof StyleMeta['labels']): string {
  return STYLE_LABELS.get(style)?.[lang] ?? style;
}
