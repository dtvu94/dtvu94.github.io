import { InvitationCopy, Lang, WeddingConfig } from './wedding.types';

/**
 * Builds the invitation copy from the wedding config for one language.
 * Hand-rolled i18n: three explicit templates, no library.
 */
export function buildWording(config: WeddingConfig, lang: Lang = 'vi'): InvitationCopy {
  const time = config.timeText[lang];
  const weekday = config.weekdayText[lang];
  const date = config.dateText[lang];
  const hall = config.hallText[lang];
  const venueName = config.venue.name[lang];
  const address = config.venue.address[lang];

  const coupleLine = `${config.groom.short} & ${config.bride.short}`;
  const monogram = `${initialOf(config.groom.short)} & ${initialOf(config.bride.short)}`;
  const rsvp = config.rsvpNote[lang];
  const shared = {
    coupleLine,
    monogram,
    rsvp,
    shortDate: formatShortDate(config.isoDate, lang),
    timeWeekday: `${time} · ${weekday}`,
    venueShort: config.venue.shortName,
    saveTheDate: 'Save the Date',
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

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}
