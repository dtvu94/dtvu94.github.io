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
  /** Filter row headings and the empty-result message. */
  formRowLabel: string;
  styleRowLabel: string;
  emptyLabel: string;
  resetLabel: string;
  /** Toggle: only designs with a place for the couple's photo. */
  photoLabel: string;
  /** Detail page: the printed suite (top) and the online invitation (bottom). */
  paperTitle: string;
  paperSub: string;
  /** Caption of each printed piece. */
  paperLabels: Record<PaperPieceKind, string>;
  onlineTitle: string;
  onlineSub: string;
  /** Shown to the couple (no guest name in the link): how to personalise it. */
  guestTip: string;
  mapsLabel: string;
  googleCalendarLabel: string;
  icsLabel: string;
}

/** The printed pieces of a suite, as laid out on the detail page. */
export type PaperPieceKind =
  | 'envelopeFront'
  | 'envelopeBack'
  | 'envelopeOpen'
  | 'card'
  | 'pocket'
  | 'insert'
  | 'foldClosed'
  | 'foldFlat'
  | 'popupClosed'
  | 'popupOpen'
  | 'passportClosed'
  | 'passportOpen'
  | 'directions';

/** Query parameter carrying the guest's name in an online invitation link. */
export const GUEST_PARAM = 'khach';

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
    formRowLabel: 'Kiểu thiệp',
    styleRowLabel: 'Phong cách',
    emptyLabel: 'Chưa có mẫu nào cho lựa chọn này.',
    resetLabel: 'Xem tất cả',
    photoLabel: 'Có ảnh cưới',
    paperTitle: 'Thiệp giấy',
    paperSub: 'Bộ thiệp in để trao tận tay: bao thư, thiệp mời và thiệp chỉ đường.',
    paperLabels: {
      envelopeFront: 'Bao thư · mặt trước',
      envelopeBack: 'Bao thư · mặt sau',
      envelopeOpen: 'Bao thư · lót trong',
      card: 'Thiệp mời',
      pocket: 'Bìa thiệp',
      insert: 'Thiệp mời bên trong',
      foldClosed: 'Thiệp gấp · bìa',
      foldFlat: 'Thiệp gấp · mặt trong',
      popupClosed: 'Thiệp pop-up · gập',
      popupOpen: 'Thiệp pop-up · mở ra',
      passportClosed: 'Hộ chiếu · bìa',
      passportOpen: 'Hộ chiếu · trang trong và vé',
      directions: 'Thiệp chỉ đường',
    },
    onlineTitle: 'Thiệp online',
    onlineSub: 'Gửi đường link qua Zalo, Messenger hay email — không cần bao thư.',
    guestTip: 'Mẹo: thêm ?khach=Tên vào cuối đường link để thiệp ghi sẵn tên khách, ví dụ',
    mapsLabel: '📍 Mở Google Maps',
    googleCalendarLabel: '📅 Lưu vào Google Calendar',
    icsLabel: '🗓️ Lưu vào lịch điện thoại',
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
    formRowLabel: 'Format',
    styleRowLabel: 'Style',
    emptyLabel: 'No designs for this combination yet.',
    resetLabel: 'Show all',
    photoLabel: 'With photo',
    paperTitle: 'Printed suite',
    paperSub: 'The printed set to hand out: envelope, invitation and directions card.',
    paperLabels: {
      envelopeFront: 'Envelope · front',
      envelopeBack: 'Envelope · back',
      envelopeOpen: 'Envelope · liner',
      card: 'Invitation',
      pocket: 'Cover',
      insert: 'Invitation inside',
      foldClosed: 'Folded card · cover',
      foldFlat: 'Folded card · inside',
      popupClosed: 'Pop-up · closed',
      popupOpen: 'Pop-up · open',
      passportClosed: 'Passport · cover',
      passportOpen: 'Passport · inside and ticket',
      directions: 'Directions card',
    },
    onlineTitle: 'Online invitation',
    onlineSub: 'Send the link by Zalo, Messenger or email — no envelope needed.',
    guestTip: 'Tip: add ?khach=Name to the end of the link to print the guest’s name on the card, e.g.',
    mapsLabel: '📍 Open Google Maps',
    googleCalendarLabel: '📅 Add to Google Calendar',
    icsLabel: '🗓️ Add to phone calendar',
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
    formRowLabel: 'รูปแบบ',
    styleRowLabel: 'สไตล์',
    emptyLabel: 'ยังไม่มีแบบสำหรับตัวเลือกนี้',
    resetLabel: 'ดูทั้งหมด',
    photoLabel: 'มีรูปคู่บ่าวสาว',
    paperTitle: 'การ์ดกระดาษ',
    paperSub: 'ชุดการ์ดพิมพ์สำหรับมอบให้แขก: ซอง การ์ดเชิญ และการ์ดแผนที่',
    paperLabels: {
      envelopeFront: 'ซอง · ด้านหน้า',
      envelopeBack: 'ซอง · ด้านหลัง',
      envelopeOpen: 'ซอง · ซับใน',
      card: 'การ์ดเชิญ',
      pocket: 'ปกการ์ด',
      insert: 'การ์ดเชิญด้านใน',
      foldClosed: 'การ์ดพับ · ปก',
      foldFlat: 'การ์ดพับ · ด้านใน',
      popupClosed: 'ป๊อปอัป · พับ',
      popupOpen: 'ป๊อปอัป · เปิด',
      passportClosed: 'พาสปอร์ต · ปก',
      passportOpen: 'พาสปอร์ต · ด้านในและตั๋ว',
      directions: 'การ์ดแผนที่',
    },
    onlineTitle: 'การ์ดออนไลน์',
    onlineSub: 'ส่งลิงก์ทาง Zalo, Messenger หรืออีเมล — ไม่ต้องใช้ซอง',
    guestTip: 'เคล็ดลับ: เติม ?khach=ชื่อ ท้ายลิงก์ เพื่อให้การ์ดแสดงชื่อแขก เช่น',
    mapsLabel: '📍 เปิด Google Maps',
    googleCalendarLabel: '📅 บันทึกใน Google Calendar',
    icsLabel: '🗓️ บันทึกในปฏิทินโทรศัพท์',
  },
};

/** "Sunday, March 28th, 2027 · 6:00 PM" badge for the gallery hero. */
export function formatDateBadge(config: WeddingConfig, lang: Lang): string {
  const weekday = config.weekdayText[lang];
  const date = config.dateText[lang];
  const time = config.timeText[lang];
  // Thai reads "วันอาทิตย์ที่ 28 …" with no comma between weekday and date.
  return lang === 'th' ? `${weekday}${date} · ${time}` : `${weekday}, ${date} · ${time}`;
}
