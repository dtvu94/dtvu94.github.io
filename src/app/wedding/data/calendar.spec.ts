import { calendarLinks, utcStamp } from './calendar';
import { WEDDING_CONFIG } from './wedding-config';

describe('calendar links', () => {
  it('converts the local party time to UTC', () => {
    expect(utcStamp('2027-03-28', '18:00', '+07:00')).toBe('20270328T110000Z');
    expect(utcStamp('2027-03-28', '06:30', '+07:00')).toBe('20270327T233000Z');
    expect(() => utcStamp('2027-13-40', '18:00', '+07:00')).toThrow();
  });

  it('prefills a Google Calendar event with title, time and place', () => {
    const links = calendarLinks(WEDDING_CONFIG, 'vi', 'Sảnh Danube, Riverside Palace', 'Thiệp Cưới', 'https://x.test/wedding/a');
    const url = new URL(links.google);
    expect(url.hostname).toBe('calendar.google.com');
    expect(url.searchParams.get('text')).toBe('Đám cưới Vũ & Thảo');
    expect(url.searchParams.get('dates')).toBe('20270328T110000Z/20270328T140000Z');
    expect(url.searchParams.get('location')).toBe('Sảnh Danube, Riverside Palace');
    expect(url.searchParams.get('details')).toContain('https://x.test/wedding/a');
  });

  it('builds a valid .ics with escaped text and CRLF lines', () => {
    const links = calendarLinks(WEDDING_CONFIG, 'en', 'Danube Hall, Riverside Palace; D4', 'Line 1\nLine 2', 'https://x.test');
    expect(links.ics.startsWith('data:text/calendar;charset=utf-8,')).toBe(true);
    const ics = decodeURIComponent(links.ics.split(',').slice(1).join(','));
    expect(ics).toContain('BEGIN:VEVENT\r\n');
    expect(ics).toContain("SUMMARY:Vũ & Thảo's wedding\r\n");
    expect(ics).toContain('DTSTART:20270328T110000Z\r\nDTEND:20270328T140000Z\r\n');
    expect(ics).toContain('LOCATION:Danube Hall\\, Riverside Palace\\; D4\r\n');
    expect(ics).toContain('DESCRIPTION:Line 1\\nLine 2\r\n');
    expect(links.icsName).toBe('dam-cuoi-2027-03-28.ics');
  });
});
