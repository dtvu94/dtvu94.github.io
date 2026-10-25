import { buildWording } from './invitation-wording';
import { WEDDING_CONFIG } from './wedding-config';

describe('buildWording', () => {
  it('builds the Vietnamese copy (default language)', () => {
    const copy = buildWording(WEDDING_CONFIG);

    expect(copy.titleWord).toBe('Thiệp Cưới');
    expect(copy.inviteHeadline).toBe('TRÂN TRỌNG KÍNH MỜI');
    expect(copy.guestPrefix).toBe('Ông / Bà:');
    expect(copy.guestSuffix).toBe('cùng gia đình');
    expect(copy.coupleLine).toBe('Vũ & Thảo');
    expect(copy.monogram).toBe('V & T');
    // The event line leads into the names: "đến dự Lễ Thành Hôn của — Vũ & Thảo".
    expect(copy.eventLine).toBe('đến dự Lễ Thành Hôn của');
    expect(copy.dateLine).toBe('Vào lúc 18 giờ 00, Chủ Nhật, ngày 28 tháng 03 năm 2027');
    expect(copy.venueLines).toEqual([
      'Tại Sảnh (đang cập nhật)',
      'Trung Tâm Hội Nghị – Tiệc Cưới Riverside Palace',
      '360D Bến Vân Đồn, P. Vĩnh Hội, Q.4, TP. Hồ Chí Minh',
    ]);
    expect(copy.closing).toContain('niềm vinh hạnh');
  });

  it('builds the English copy', () => {
    const copy = buildWording(WEDDING_CONFIG, 'en');

    expect(copy.titleWord).toBe('Wedding Invitation');
    expect(copy.inviteHeadline).toBe('WE CORDIALLY INVITE YOU');
    expect(copy.guestPrefix).toBe('Mr / Ms / Mrs');
    expect(copy.guestSuffix).toBe('& family');
    expect(copy.eventLine).toBe('to celebrate the wedding of');
    expect(copy.dateLine).toBe('At 6:00 PM, Sunday, March 28th, 2027');
    expect(copy.venueLines).toEqual([
      'Hall: to be announced',
      'Riverside Palace Convention & Wedding Center',
      '360D Bến Vân Đồn, Vĩnh Hội Ward, District 4, Ho Chi Minh City',
    ]);
    // The couple's names stay Vietnamese in every language.
    expect(copy.coupleLine).toBe('Vũ & Thảo');
  });

  it('builds the Thai copy with the Buddhist-era year', () => {
    const copy = buildWording(WEDDING_CONFIG, 'th');

    expect(copy.titleWord).toBe('การ์ดแต่งงาน');
    expect(copy.inviteHeadline).toBe('ขอเรียนเชิญ');
    expect(copy.guestPrefix).toBe('คุณ');
    expect(copy.guestSuffix).toBe('พร้อมครอบครัว');
    expect(copy.eventLine).toBe('ร่วมเป็นเกียรติในพิธีมงคลสมรสของ');
    expect(copy.dateLine).toBe('เวลา 18:00 น. วันอาทิตย์ที่ 28 มีนาคม พ.ศ. 2570');
    expect(copy.venueLines[0]).toContain('ห้องจัดเลี้ยง');
    expect(copy.coupleLine).toBe('Vũ & Thảo');
  });

  it('builds the short cover copy in every language', () => {
    const vi = buildWording(WEDDING_CONFIG);
    expect(vi.kicker).toBe('Lễ Thành Hôn');
    expect(vi.shortDate).toBe('28 · 03 · 2027');
    expect(vi.timeWeekday).toBe('18 giờ 00 · Chủ Nhật');
    expect(vi.venueShort).toBe('Riverside Palace');
    expect(vi.guestLabel).toBe('Kính mời');

    const en = buildWording(WEDDING_CONFIG, 'en');
    expect(en.kicker).toBe('The Wedding of');
    expect(en.timeWeekday).toBe('6:00 PM · Sunday');

    // Thai short dates use the Buddhist Era as well.
    const th = buildWording(WEDDING_CONFIG, 'th');
    expect(th.shortDate).toBe('28 · 03 · 2570');
    expect(th.guestLabel).toBe('เรียน');
  });

  it('lays out the wedding month for the calendar panel', () => {
    // 1 March 2027 is a Monday; the 28th is a Sunday.
    const vi = buildWording(WEDDING_CONFIG);
    expect(vi.monthTitle).toBe('Tháng 03 · 2027');
    expect(vi.weekdays[6]).toBe('CN');
    expect(vi.day).toBe(28);
    expect(vi.monthOffset).toBe(0);
    expect(vi.daysInMonth).toBe(31);
    expect((vi.monthOffset + vi.day - 1) % 7).toBe(6);
    expect(buildWording(WEDDING_CONFIG, 'en').monthTitle).toBe('March 2027');
    expect(buildWording(WEDDING_CONFIG, 'th').monthTitle).toBe('มีนาคม 2570');
  });

  it('labels the passport and boarding pass in every language', () => {
    expect(buildWording(WEDDING_CONFIG).passport.airline).toBe('V&T Airlines');
    expect(buildWording(WEDDING_CONFIG).passport.passenger).toBe('Hành khách');
    expect(buildWording(WEDDING_CONFIG, 'th').passport.boarding).toBe('เวลาขึ้น');
    expect(buildWording(WEDDING_CONFIG, 'en').photoSoon).toContain('coming soon');
  });

  it('renders the lunar line only in Vietnamese', () => {
    const config = { ...WEDDING_CONFIG, lunarDateText: 'nhằm ngày 21 tháng 02 năm Đinh Mùi' };
    expect(buildWording(config).lunarLine).toBe('(nhằm ngày 21 tháng 02 năm Đinh Mùi)');
    expect(buildWording(config, 'en').lunarLine).toBeUndefined();
    expect(buildWording(config, 'th').lunarLine).toBeUndefined();
    expect(buildWording(WEDDING_CONFIG).lunarLine).toBeUndefined();
  });
});
