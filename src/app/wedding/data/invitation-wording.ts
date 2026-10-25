import { InvitationCopy, Lang, MapCardCopy, PassportCopy, WeddingConfig } from './wedding.types';

const WEEKDAYS: Record<Lang, string[]> = {
  vi: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  th: ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'],
};

const MONTHS: Record<'en' | 'th', string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
};

/** The hall line of the address block, from the hall's name ('' = not chosen yet). */
const HALL_LINE: Record<Lang, (name: string) => string> = {
  vi: (name) => (name ? `Sảnh ${name}` : 'Sảnh (đang cập nhật)'),
  en: (name) => (name ? `${name} Hall` : 'Hall: to be announced'),
  th: (name) => (name ? `ห้องจัดเลี้ยง ${name}` : 'ห้องจัดเลี้ยง: จะแจ้งให้ทราบ'),
};

/** The boarding pass's hall field while no hall is chosen. */
const HALL_TBA: Record<Lang, string> = { vi: 'Đang cập nhật', en: 'TBA', th: 'แจ้งภายหลัง' };

const PASSPORT: Record<Lang, Omit<PassportCopy, 'airline' | 'hall'>> = {
  vi: {
    title: 'WEDDING PASSPORT',
    subtitle: 'Hộ chiếu đến hôn nhân',
    boardingPass: 'BOARDING PASS',
    passenger: 'Hành khách',
    from: 'Từ',
    to: 'Đến',
    date: 'Ngày',
    boarding: 'Giờ đón',
    gate: 'Sảnh',
    seat: 'Bàn',
    fromPlace: 'Tình yêu',
  },
  en: {
    title: 'WEDDING PASSPORT',
    subtitle: 'Passport to marriage',
    boardingPass: 'BOARDING PASS',
    passenger: 'Passenger',
    from: 'From',
    to: 'To',
    date: 'Date',
    boarding: 'Boarding',
    gate: 'Hall',
    seat: 'Table',
    fromPlace: 'Love',
  },
  th: {
    title: 'WEDDING PASSPORT',
    subtitle: 'พาสปอร์ตสู่การแต่งงาน',
    boardingPass: 'BOARDING PASS',
    passenger: 'ผู้โดยสาร',
    from: 'จาก',
    to: 'ถึง',
    date: 'วันที่',
    boarding: 'เวลาขึ้น',
    gate: 'ห้อง',
    seat: 'โต๊ะ',
    fromPlace: 'ความรัก',
  },
};

const VENUE_LABEL: Record<Lang, string> = { vi: 'Địa điểm', en: 'Venue', th: 'สถานที่' };

const MAP_CARD: Record<Lang, MapCardCopy> = {
  vi: { title: 'Đường đến tiệc cưới', scan: 'Quét mã để mở Google Maps', sketch: 'Sơ đồ minh họa, không theo tỷ lệ' },
  en: { title: 'Getting to the party', scan: 'Scan to open Google Maps', sketch: 'Sketch map, not to scale' },
  th: { title: 'เส้นทางไปงานเลี้ยง', scan: 'สแกนเพื่อเปิด Google Maps', sketch: 'แผนที่โดยสังเขป ไม่ตรงตามมาตราส่วน' },
};

const PHOTO_SOON: Record<Lang, string> = {
  vi: 'Ảnh cưới sẽ cập nhật sau',
  en: 'Wedding photo coming soon',
  th: 'รูปแต่งงานเร็ว ๆ นี้',
};

/**
 * Builds the invitation copy from the wedding config for one language.
 * Hand-rolled i18n: three explicit templates, no library.
 */
export function buildWording(config: WeddingConfig, lang: Lang = 'vi'): InvitationCopy {
  const time = config.timeText[lang];
  const weekday = config.weekdayText[lang];
  const date = config.dateText[lang];
  const hall = HALL_LINE[lang](config.hall);
  const venueName = config.venue.name[lang];
  const address = config.venue.address[lang];

  const coupleLine = `${config.groom.short} & ${config.bride.short}`;
  const monogram = `${initialOf(config.groom.short)} & ${initialOf(config.bride.short)}`;
  const rsvp = config.rsvpNote[lang];
  const [year, month, day] = config.isoDate.split('-').map(Number);
  const shared = {
    coupleLine,
    monogram,
    rsvp,
    shortDate: formatShortDate(config.isoDate, lang),
    timeWeekday: `${time} · ${weekday}`,
    venueShort: config.venue.shortName,
    saveTheDate: 'Save the Date',
    monthTitle: monthTitle(year, month, lang),
    weekdays: WEEKDAYS[lang],
    day,
    // Monday-first grid: getUTCDay() is 0 for Sunday.
    monthOffset: (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7,
    daysInMonth: new Date(Date.UTC(year, month, 0)).getUTCDate(),
    photoSoon: PHOTO_SOON[lang],
    venueLabel: VENUE_LABEL[lang],
    mapCard: MAP_CARD[lang],
    passport: {
      ...PASSPORT[lang],
      hall: config.hall || HALL_TBA[lang],
      airline: `${initialOf(config.groom.short)}&${initialOf(config.bride.short)} Airlines`,
    },
  };

  switch (lang) {
    case 'en':
      return {
        ...shared,
        titleWord: 'Wedding Invitation',
        inviteHeadline: 'WE CORDIALLY INVITE YOU',
        guestPrefix: 'Mr / Ms / Mrs',
        guestSuffix: '& family',
        // Rendered above the names: "to celebrate the wedding of — Vũ & Thảo".
        eventLine: 'to celebrate the wedding of',
        dateLine: `At ${time}, ${weekday}, ${date}`,
        venueLines: [hall, venueName, address],
        closing: "Your presence will be our family's greatest joy and honor.",
        kicker: 'The Wedding of',
        guestLabel: 'To',
      };
    case 'th':
      return {
        ...shared,
        titleWord: 'การ์ดแต่งงาน',
        inviteHeadline: 'ขอเรียนเชิญ',
        guestPrefix: 'คุณ',
        guestSuffix: 'พร้อมครอบครัว',
        // Rendered above the names: "ร่วมเป็นเกียรติในพิธีมงคลสมรสของ — Vũ & Thảo".
        eventLine: 'ร่วมเป็นเกียรติในพิธีมงคลสมรสของ',
        dateLine: `เวลา ${time} ${weekday}${date}`,
        venueLines: [hall, venueName, address],
        closing: 'การมาร่วมงานของท่านถือเป็นเกียรติอันยิ่งใหญ่ของครอบครัวเรา',
        kicker: 'พิธีมงคลสมรส',
        guestLabel: 'เรียน',
      };
    default:
      return {
        ...shared,
        titleWord: 'Thiệp Cưới',
        inviteHeadline: 'TRÂN TRỌNG KÍNH MỜI',
        guestPrefix: 'Ông / Bà:',
        guestSuffix: 'cùng gia đình',
        // Rendered above the names: "đến dự Lễ Thành Hôn của — Vũ & Thảo".
        eventLine: 'đến dự Lễ Thành Hôn của',
        dateLine: `Vào lúc ${time}, ${weekday}, ${date}`,
        lunarLine: config.lunarDateText ? `(${config.lunarDateText})` : undefined,
        venueLines: [`Tại ${hall}`, venueName, address],
        closing: 'Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi.',
        kicker: 'Lễ Thành Hôn',
        guestLabel: 'Kính mời',
      };
  }
}

/** "28 · 03 · 2027"; Thai counts years in the Buddhist Era (+543). */
export function formatShortDate(isoDate: string, lang: Lang): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const shownYear = lang === 'th' ? year + 543 : year;
  return `${pad(day)} · ${pad(month)} · ${shownYear}`;
}

function monthTitle(year: number, month: number, lang: Lang): string {
  if (lang === 'vi') {
    return `Tháng ${pad(month)} · ${year}`;
  }
  return lang === 'th' ? `${MONTHS.th[month - 1]} ${year + 543}` : `${MONTHS.en[month - 1]} ${year}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}
