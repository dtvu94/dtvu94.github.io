import { Lang, WeddingConfig } from './wedding.types';

/** "Add to calendar" links for the online invitation. */
export interface CalendarLinks {
  /** Google Calendar "create event" page, prefilled. */
  google: string;
  /** An .ics file as a data: URL — opens in Apple Calendar, Outlook, most phones. */
  ics: string;
  /** Suggested download name for the .ics file. */
  icsName: string;
}

const TITLE: Record<Lang, (couple: string) => string> = {
  vi: (couple) => `Đám cưới ${couple}`,
  en: (couple) => `${couple}'s wedding`,
  th: (couple) => `งานแต่งงาน ${couple}`,
};

/** "2027-03-28" + "18:00" + "+07:00" → "20270328T110000Z". */
export function utcStamp(isoDate: string, time: string, offset: string): string {
  const date = new Date(`${isoDate}T${time}:00${offset}`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid wedding date/time: ${isoDate} ${time} ${offset}`);
  }
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** RFC 5545 TEXT escaping: backslash, semicolon, comma and newlines. */
function icsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

export function calendarLinks(
  config: WeddingConfig,
  lang: Lang,
  location: string,
  details: string,
  pageUrl: string,
): CalendarLinks {
  const couple = `${config.groom.short} & ${config.bride.short}`;
  const title = TITLE[lang](couple);
  const start = utcStamp(config.isoDate, config.startTime, config.utcOffset);
  const end = utcStamp(config.isoDate, config.endTime, config.utcOffset);

  const google =
    'https://calendar.google.com/calendar/render?' +
    new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${start}/${end}`,
      location,
      details: `${details}\n${pageUrl}`,
    }).toString();

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//dtvu94.github.io//wedding//VI',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:wedding-${config.isoDate}@dtvu94.github.io`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${icsText(title)}`,
    `LOCATION:${icsText(location)}`,
    `DESCRIPTION:${icsText(details)}`,
    `URL:${pageUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');

  return {
    google,
    ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`,
    icsName: `dam-cuoi-${config.isoDate}.ics`,
  };
}
