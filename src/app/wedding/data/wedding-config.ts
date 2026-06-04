import { WeddingConfig } from './wedding.types';

/**
 * Single edit point for all wedding facts shown on every invitation sample,
 * in all three languages (vi / en / th).
 *
 * When the hall is chosen (or full names / lunar date are decided), update the
 * fields below, then `npm run build` and commit the regenerated `docs/`.
 */
export const WEDDING_CONFIG: WeddingConfig = {
  groom: { short: 'Vũ', full: '' },
  bride: { short: 'Thảo', full: '' },
  timeText: {
    vi: '11 giờ 00',
    en: '11:00 AM',
    th: '11:00 น.',
  },
  weekdayText: {
    vi: 'Chủ Nhật',
    en: 'Sunday',
    th: 'วันอาทิตย์',
  },
  dateText: {
    vi: 'ngày 28 tháng 03 năm 2027',
    en: 'March 28th, 2027',
    // Thai customarily uses the Buddhist Era: 2027 CE = พ.ศ. 2570.
    th: 'ที่ 28 มีนาคม พ.ศ. 2570',
  },
  lunarDateText: '',
  hallText: {
    vi: 'Sảnh (đang cập nhật)',
    en: 'Hall: to be announced',
    th: 'ห้องจัดเลี้ยง: จะแจ้งให้ทราบ',
  },
  venue: {
    name: {
      vi: 'Trung Tâm Hội Nghị – Tiệc Cưới Riverside Palace',
      en: 'Riverside Palace Convention & Wedding Center',
      th: 'ศูนย์การประชุมและงานเลี้ยง Riverside Palace',
    },
    address: {
      vi: '360D Bến Vân Đồn, P. Vĩnh Hội, Q.4, TP. Hồ Chí Minh',
      en: '360D Bến Vân Đồn, Vĩnh Hội Ward, District 4, Ho Chi Minh City',
      th: 'เลขที่ 360D ถนน Bến Vân Đồn เขต 4 นครโฮจิมินห์',
    },
    lat: 10.7557295,
    lng: 106.6903722,
    mapsShareUrl: 'https://maps.app.goo.gl/hdefzxnNdPnbr4ob6',
  },
  rsvpNote: {
    vi: 'Rất hân hạnh được đón tiếp!',
    en: 'We look forward to celebrating with you!',
    th: 'เรารอต้อนรับทุกท่านด้วยความยินดียิ่ง!',
  },
};
