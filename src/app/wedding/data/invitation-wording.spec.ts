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

  it('renders the lunar line only in Vietnamese', () => {
    const config = { ...WEDDING_CONFIG, lunarDateText: 'nhằm ngày 21 tháng 02 năm Đinh Mùi' };
    expect(buildWording(config).lunarLine).toBe('(nhằm ngày 21 tháng 02 năm Đinh Mùi)');
    expect(buildWording(config, 'en').lunarLine).toBeUndefined();
    expect(buildWording(config, 'th').lunarLine).toBeUndefined();
    expect(buildWording(WEDDING_CONFIG).lunarLine).toBeUndefined();
  });
});
