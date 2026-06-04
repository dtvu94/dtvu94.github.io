import { DirectionsContent, Lang } from './wedding.types';
import { WEDDING_CONFIG } from './wedding-config';

const VENUE = WEDDING_CONFIG.venue;

/** Language-independent Google Maps links. */
export const MAPS_LINKS = {
  embedUrl: `https://maps.google.com/maps?q=${VENUE.lat},${VENUE.lng}&z=16&output=embed`,
  openMapsUrl: VENUE.mapsShareUrl,
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${VENUE.lat},${VENUE.lng}`,
} as const;

/**
 * Hướng dẫn đường đi từ trung tâm Quận 1 đến Riverside Palace (Quận 4),
 * in all three languages. Street/bridge names stay in Vietnamese — that is
 * what guests will see on signs and in Google Maps.
 * Các bước chỉ mang tính tham khảo — liên kết Google Maps là nguồn chính xác nhất.
 */
const CONTENT: Record<Lang, DirectionsContent> = {
  vi: {
    kicker: 'Hướng dẫn đi lại',
    title: 'Đường đến tiệc cưới',
    fromLabel:
      'Từ trung tâm Quận 1 (khu vực Chợ Bến Thành), Riverside Palace nằm ngay bên kia kênh Bến Nghé — chỉ khoảng 2,5–3 km, chừng 10 phút di chuyển.',
    venueName: VENUE.name.vi,
    venueAddress: VENUE.address.vi,
    ...MAPS_LINKS,
    openMapsLabel: '📍 Mở Google Maps',
    directionsLabel: '🧭 Chỉ đường từ vị trí của bạn',
    mapOnlineLabel: 'Bản đồ trực tuyến:',
    routes: [
      {
        id: 'ong-lanh',
        title: 'Qua cầu Ông Lãnh',
        approxKm: '~2,5 km',
        approxTime: '~10 phút',
        steps: [
          'Từ Chợ Bến Thành, đi đường Trần Hưng Đạo rồi rẽ trái vào Nguyễn Thái Học.',
          'Đi thẳng Nguyễn Thái Học, qua cầu Ông Lãnh sang Quận 4.',
          'Xuống cầu, rẽ phải vào đường Bến Vân Đồn.',
          'Đi khoảng 600 m dọc bờ kênh đến số 360D Bến Vân Đồn — Riverside Palace.',
        ],
      },
      {
        id: 'calmette',
        title: 'Qua cầu Calmette',
        approxKm: '~2,7 km',
        approxTime: '~10 phút',
        steps: [
          'Từ đường Hàm Nghi, rẽ vào đường Calmette.',
          'Đi thẳng qua cầu Calmette sang Quận 4.',
          'Xuống cầu, rẽ phải vào đường Bến Vân Đồn.',
          'Đi khoảng 1,2 km dọc bờ kênh đến số 360D Bến Vân Đồn — Riverside Palace.',
        ],
      },
      {
        id: 'khanh-hoi',
        title: 'Qua cầu Khánh Hội',
        approxKm: '~3 km',
        approxTime: '~12 phút',
        steps: [
          'Từ khu vực Bến Bạch Đằng / phố đi bộ Nguyễn Huệ, đi theo đường Tôn Đức Thắng.',
          'Qua cầu Khánh Hội sang Quận 4.',
          'Xuống cầu, rẽ phải vào đường Bến Vân Đồn.',
          'Đi khoảng 1,5 km dọc bờ kênh đến số 360D Bến Vân Đồn — Riverside Palace.',
        ],
      },
    ],
    rideHailNote:
      'Grab / taxi từ trung tâm Quận 1 chỉ khoảng 10 phút — đặt điểm đến “Riverside Palace, 360D Bến Vân Đồn, Quận 4”.',
    metroNote: 'Metro số 1: xuống ga Bến Thành, sau đó đi taxi hoặc xe công nghệ thêm khoảng 10 phút.',
    busNote:
      'Một số tuyến xe buýt đi qua khu vực Bến Vân Đồn (31, 56, 75…) — vui lòng tra cứu BusMap hoặc Google Maps để có lộ trình mới nhất.',
    parkingNote: 'Trung tâm có bãi giữ xe máy và ô tô dành cho khách mời.',
  },
  en: {
    kicker: 'Getting there',
    title: 'Directions to the venue',
    fromLabel:
      'From central District 1 (Bến Thành Market area), Riverside Palace is just across the Bến Nghé canal — about 2.5–3 km, roughly 10 minutes away.',
    venueName: VENUE.name.en,
    venueAddress: VENUE.address.en,
    ...MAPS_LINKS,
    openMapsLabel: '📍 Open Google Maps',
    directionsLabel: '🧭 Directions from your location',
    mapOnlineLabel: 'Online map:',
    routes: [
      {
        id: 'ong-lanh',
        title: 'Via Ông Lãnh Bridge',
        approxKm: '~2.5 km',
        approxTime: '~10 min',
        steps: [
          'From Bến Thành Market, take Trần Hưng Đạo street, then turn left onto Nguyễn Thái Học.',
          'Go straight along Nguyễn Thái Học and cross Ông Lãnh Bridge into District 4.',
          'After the bridge, turn right onto Bến Vân Đồn street.',
          'Continue about 600 m along the canal to 360D Bến Vân Đồn — Riverside Palace.',
        ],
      },
      {
        id: 'calmette',
        title: 'Via Calmette Bridge',
        approxKm: '~2.7 km',
        approxTime: '~10 min',
        steps: [
          'From Hàm Nghi street, turn onto Calmette street.',
          'Go straight across Calmette Bridge into District 4.',
          'After the bridge, turn right onto Bến Vân Đồn street.',
          'Continue about 1.2 km along the canal to 360D Bến Vân Đồn — Riverside Palace.',
        ],
      },
      {
        id: 'khanh-hoi',
        title: 'Via Khánh Hội Bridge',
        approxKm: '~3 km',
        approxTime: '~12 min',
        steps: [
          'From the Bạch Đằng Wharf / Nguyễn Huệ walking street area, follow Tôn Đức Thắng street.',
          'Cross Khánh Hội Bridge into District 4.',
          'After the bridge, turn right onto Bến Vân Đồn street.',
          'Continue about 1.5 km along the canal to 360D Bến Vân Đồn — Riverside Palace.',
        ],
      },
    ],
    rideHailNote:
      'Grab / taxi from central District 1 takes about 10 minutes — set your destination to “Riverside Palace, 360D Bến Vân Đồn, District 4”.',
    metroNote: 'Metro Line 1: get off at Bến Thành Station, then a ~10-minute taxi or ride-hailing trip.',
    busNote:
      'Several bus lines pass the Bến Vân Đồn area (31, 56, 75…) — check BusMap or Google Maps for the latest routes.',
    parkingNote: 'The venue provides car and motorbike parking for guests.',
  },
  th: {
    kicker: 'การเดินทาง',
    title: 'เส้นทางไปงานแต่ง',
    fromLabel:
      'จากใจกลางเขต 1 (ย่านตลาด Bến Thành) Riverside Palace อยู่ฝั่งตรงข้ามคลอง Bến Nghé — ระยะทางประมาณ 2.5–3 กม. ใช้เวลาประมาณ 10 นาที',
    venueName: VENUE.name.th,
    venueAddress: VENUE.address.th,
    ...MAPS_LINKS,
    openMapsLabel: '📍 เปิด Google Maps',
    directionsLabel: '🧭 นำทางจากตำแหน่งของคุณ',
    mapOnlineLabel: 'แผนที่ออนไลน์:',
    routes: [
      {
        id: 'ong-lanh',
        title: 'ผ่านสะพาน Ông Lãnh',
        approxKm: '~2.5 กม.',
        approxTime: '~10 นาที',
        steps: [
          'จากตลาด Bến Thành ใช้ถนน Trần Hưng Đạo แล้วเลี้ยวซ้ายเข้าถนน Nguyễn Thái Học',
          'ตรงไปตามถนน Nguyễn Thái Học ข้ามสะพาน Ông Lãnh เข้าสู่เขต 4',
          'ลงสะพานแล้วเลี้ยวขวาเข้าถนน Bến Vân Đồn',
          'ตรงไปเลียบคลองประมาณ 600 ม. ถึงเลขที่ 360D Bến Vân Đồn — Riverside Palace',
        ],
      },
      {
        id: 'calmette',
        title: 'ผ่านสะพาน Calmette',
        approxKm: '~2.7 กม.',
        approxTime: '~10 นาที',
        steps: [
          'จากถนน Hàm Nghi เลี้ยวเข้าถนน Calmette',
          'ตรงไปข้ามสะพาน Calmette เข้าสู่เขต 4',
          'ลงสะพานแล้วเลี้ยวขวาเข้าถนน Bến Vân Đồn',
          'ตรงไปเลียบคลองประมาณ 1.2 กม. ถึงเลขที่ 360D Bến Vân Đồn — Riverside Palace',
        ],
      },
      {
        id: 'khanh-hoi',
        title: 'ผ่านสะพาน Khánh Hội',
        approxKm: '~3 กม.',
        approxTime: '~12 นาที',
        steps: [
          'จากย่านท่าเรือ Bạch Đằng / ถนนคนเดิน Nguyễn Huệ ใช้ถนน Tôn Đức Thắng',
          'ข้ามสะพาน Khánh Hội เข้าสู่เขต 4',
          'ลงสะพานแล้วเลี้ยวขวาเข้าถนน Bến Vân Đồn',
          'ตรงไปเลียบคลองประมาณ 1.5 กม. ถึงเลขที่ 360D Bến Vân Đồn — Riverside Palace',
        ],
      },
    ],
    rideHailNote:
      'Grab / แท็กซี่จากใจกลางเขต 1 ใช้เวลาประมาณ 10 นาที — ตั้งจุดหมายเป็น “Riverside Palace, 360D Bến Vân Đồn, District 4”',
    metroNote: 'รถไฟฟ้าสาย 1: ลงที่สถานี Bến Thành แล้วต่อแท็กซี่หรือรถเรียกผ่านแอปอีกประมาณ 10 นาที',
    busNote:
      'มีรถเมล์หลายสายผ่านย่าน Bến Vân Đồn (31, 56, 75…) — ตรวจสอบเส้นทางล่าสุดได้ที่ BusMap หรือ Google Maps',
    parkingNote: 'สถานที่จัดงานมีที่จอดรถยนต์และรถจักรยานยนต์สำหรับแขก',
  },
};

export function getDirections(lang: Lang = 'vi'): DirectionsContent {
  return CONTENT[lang];
}
