import { Lang, WeddingConfig } from './wedding.types';

/** Page-chrome strings (everything outside the invitation card itself). */
export interface WeddingUiStrings {
  docTitle: string;
  detailTitleSuffix: string;
  heroTitle: string;
  heroSub: string;
  allLabel: string;
  backHome: string;
  backToGallery: string;
  printLabel: string;
  detailHint: string;
  langGroupLabel: string;
}

export const WEDDING_UI: Record<Lang, WeddingUiStrings> = {
  vi: {
    docTitle: 'Thiệp Cưới — Vũ & Thảo',
    detailTitleSuffix: 'Thiệp Cưới Vũ & Thảo',
    heroTitle: 'Chọn Mẫu Thiệp Cưới',
    heroSub:
      'Em chọn mẫu em thích nhất nhé — bấm vào thiệp để xem chi tiết và hướng dẫn đường đi cho khách mời. 💍',
    allLabel: 'Tất cả',
    backHome: '← Về trang chủ',
    backToGallery: '← Tất cả mẫu thiệp',
    printLabel: '🖨️ In thử mẫu này',
    detailHint: 'Nếu em ưng mẫu này, gửi anh đường link của trang này nhé 💌',
    langGroupLabel: 'Ngôn ngữ',
  },
  en: {
    docTitle: 'Wedding Invitation — Vũ & Thảo',
    detailTitleSuffix: 'Vũ & Thảo Wedding Invitation',
    heroTitle: 'Choose Our Wedding Invitation',
    heroSub:
      'Pick the design you love the most — tap a card for the details and the travel guide for our guests. 💍',
    allLabel: 'All',
    backHome: '← Back to home',
    backToGallery: '← All designs',
    printLabel: '🖨️ Print this design',
    detailHint: 'If this is the one, send me the link to this page 💌',
    langGroupLabel: 'Language',
  },
  th: {
    docTitle: 'การ์ดแต่งงาน — Vũ & Thảo',
    detailTitleSuffix: 'การ์ดแต่งงาน Vũ & Thảo',
    heroTitle: 'เลือกแบบการ์ดแต่งงาน',
    heroSub: 'เลือกแบบที่คุณชอบที่สุด — แตะที่การ์ดเพื่อดูรายละเอียดและเส้นทางสำหรับแขก 💍',
    allLabel: 'ทั้งหมด',
    backHome: '← กลับหน้าหลัก',
    backToGallery: '← การ์ดทั้งหมด',
    printLabel: '🖨️ พิมพ์การ์ดนี้',
    detailHint: 'ถ้าชอบแบบนี้ ส่งลิงก์หน้านี้มาให้เรานะ 💌',
    langGroupLabel: 'ภาษา',
  },
};

/** "Sunday, March 28th, 2027 · 11:00 AM" badge for the gallery hero. */
export function formatDateBadge(config: WeddingConfig, lang: Lang): string {
  const weekday = config.weekdayText[lang];
  const date = config.dateText[lang];
  const time = config.timeText[lang];
  // Thai reads "วันอาทิตย์ที่ 28 …" with no comma between weekday and date.
  return lang === 'th' ? `${weekday}${date} · ${time}` : `${weekday}, ${date} · ${time}`;
}
