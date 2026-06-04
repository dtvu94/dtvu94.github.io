import { CategoryMeta, InvitationDesign } from './wedding.types';

export const DESIGN_CATEGORIES: CategoryMeta[] = [
  { id: 'modern', labels: { vi: 'Hiện đại', en: 'Modern', th: 'โมเดิร์น' } },
  { id: 'minimalist', labels: { vi: 'Tối giản', en: 'Minimalist', th: 'มินิมอล' } },
  { id: 'vintage', labels: { vi: 'Vintage', en: 'Vintage', th: 'วินเทจ' } },
  { id: 'classic', labels: { vi: 'Cổ điển', en: 'Classic', th: 'คลาสสิก' } },
  { id: 'floral', labels: { vi: 'Hoa lá', en: 'Floral', th: 'ลายดอกไม้' } },
  { id: 'vietnamese', labels: { vi: 'Truyền thống', en: 'Traditional', th: 'ดั้งเดิม' } },
  { id: 'rustic', labels: { vi: 'Mộc mạc', en: 'Rustic', th: 'รัสติก' } },
  { id: 'artdeco', labels: { vi: 'Art Deco', en: 'Art Deco', th: 'อาร์ตเดโค' } },
];

/**
 * The 24 invitation samples. Mỗi mẫu chỉ là dữ liệu — InvitationCardComponent
 * dựng thiệp từ palette + font + layout + họa tiết, nên thêm/sửa mẫu chỉ cần
 * thêm/sửa một entry ở đây. Design names are proper nouns (shown unchanged in
 * every language); only the blurbs are localized.
 */
export const INVITATION_DESIGNS: InvitationDesign[] = [
  // ── Hiện đại / Modern ───────────────────────────────────────────────────
  {
    id: 'modern-noir',
    nameVi: 'Noir Ánh Kim',
    category: 'modern',
    description: {
      vi: 'Nền đen sang trọng, chữ trắng tinh tế điểm vàng kim.',
      en: 'Luxurious black, crisp white type with gold accents.',
      th: 'พื้นดำหรูหรา ตัวอักษรขาวแต่งแต้มสีทอง',
    },
    palette: { bg: '#0f1115', surface: '#16181d', primary: '#ffffff', accent: '#c9a227', ink: '#d8dadd' },
    fonts: { display: 'montserrat', body: 'beVietnamPro' },
    layout: 'minimalLine',
    ornament: 'hairlineFlourish',
    ornamentSecondary: 'grandAmpersand',
    accentStyle: 'gold',
  },
  {
    id: 'modern-blush',
    nameVi: 'Hồng Phấn',
    category: 'modern',
    description: {
      vi: 'Tông hồng phấn dịu dàng, hiện đại và trẻ trung.',
      en: 'Soft blush pink — modern and youthful.',
      th: 'ชมพูพาสเทลอ่อนหวาน ทันสมัยและสดใส',
    },
    palette: { bg: '#fbeff0', surface: '#ffffff', primary: '#2b2b2b', accent: '#d98b9a', ink: '#4a4a4a' },
    fonts: { display: 'montserrat', body: 'beVietnamPro', accent: 'dancingScript' },
    layout: 'archFrame',
    ornament: 'none',
  },
  {
    id: 'modern-sage',
    nameVi: 'Xanh Mạ',
    category: 'modern',
    description: {
      vi: 'Xanh lá nhẹ nhàng, bố cục chia đôi thoáng đãng.',
      en: 'Gentle sage green with an airy split layout.',
      th: 'เขียวเซจอ่อนโยน เลย์เอาต์แบ่งครึ่งโปร่งสบาย',
    },
    palette: { bg: '#eef3ee', surface: '#ffffff', primary: '#2f3a33', accent: '#7c9a76', ink: '#3d473f' },
    fonts: { display: 'montserrat', body: 'lora' },
    layout: 'splitVertical',
    ornament: 'botanicalSprig',
  },
  {
    id: 'modern-mono',
    nameVi: 'Trắng Đen',
    category: 'modern',
    description: {
      vi: 'Đen trắng tương phản mạnh, phong cách tối tân.',
      en: 'Bold black & white, ultra-contemporary.',
      th: 'ขาวดำคมชัด สไตล์ร่วมสมัยเต็มขั้น',
    },
    palette: { bg: '#ffffff', surface: '#ffffff', primary: '#111111', accent: '#111111', ink: '#2a2a2a' },
    fonts: { display: 'playfair', body: 'montserrat' },
    layout: 'editorialAsym',
    ornament: 'geoFrame',
    ornamentSecondary: 'grandAmpersand',
  },

  // ── Tối giản / Minimalist ───────────────────────────────────────────────
  {
    id: 'min-air',
    nameVi: 'Khoảng Lặng',
    category: 'minimalist',
    description: {
      vi: 'Tối giản tuyệt đối — chỉ chữ và khoảng trắng.',
      en: 'Pure minimalism — just type and white space.',
      th: 'มินิมอลแท้ ๆ มีเพียงตัวอักษรและพื้นที่ว่าง',
    },
    palette: { bg: '#fafafa', surface: '#ffffff', primary: '#1a1a1a', accent: '#b9b3a9', ink: '#3a3a3a' },
    fonts: { display: 'beVietnamPro', body: 'beVietnamPro' },
    layout: 'minimalLine',
    ornament: 'none',
  },
  {
    id: 'min-line',
    nameVi: 'Nét Thanh',
    category: 'minimalist',
    description: {
      vi: 'Một đường kẻ mảnh, serif thanh lịch.',
      en: 'One hairline rule and an elegant serif.',
      th: 'เส้นบางเส้นเดียว กับเซริฟอันสง่างาม',
    },
    palette: { bg: '#ffffff', surface: '#ffffff', primary: '#222222', accent: '#8a8a8a', ink: '#444444' },
    fonts: { display: 'cormorant', body: 'beVietnamPro' },
    layout: 'minimalLine',
    ornament: 'hairlineFlourish',
  },
  {
    id: 'min-sand',
    nameVi: 'Cát Nhạt',
    category: 'minimalist',
    description: {
      vi: 'Be cát ấm áp, gọn gàng và trang nhã.',
      en: 'Warm sandy beige, neat and refined.',
      th: 'เบจโทนทรายอบอุ่น เรียบร้อยและประณีต',
    },
    palette: { bg: '#f3efe8', surface: '#fbf8f2', primary: '#3b352c', accent: '#a98f6b', ink: '#4d463a' },
    fonts: { display: 'montserrat', body: 'lora' },
    layout: 'archFrame',
    ornament: 'hairlineFlourish',
  },

  // ── Vintage ─────────────────────────────────────────────────────────────
  {
    id: 'vintage-sepia',
    nameVi: 'Hoài Niệm',
    category: 'vintage',
    description: {
      vi: 'Giấy ngả vàng sepia, khung viền hoa văn xưa.',
      en: 'Sepia-toned paper with an antique border.',
      th: 'กระดาษโทนซีเปีย กรอบลวดลายโบราณ',
    },
    palette: { bg: '#efe6d6', surface: '#f7f0e2', primary: '#4a3a26', accent: '#9c6b3f', ink: '#5a4630' },
    fonts: { display: 'playfair', body: 'cormorant', accent: 'pinyonScript' },
    layout: 'framedBorder',
    ornament: 'floralCorner',
    ornamentSecondary: 'hairlineFlourish',
  },
  {
    id: 'vintage-rose',
    nameVi: 'Hồng Cổ',
    category: 'vintage',
    description: {
      vi: 'Hồng đất cổ điển, vòng nguyệt quế lãng mạn.',
      en: 'Old-rose tones and a romantic wreath.',
      th: 'โทนกุหลาบคลาสสิก พวงใบไม้แสนโรแมนติก',
    },
    palette: { bg: '#f0e3df', surface: '#faf2ee', primary: '#5a3a3a', accent: '#b07a6e', ink: '#5e4642' },
    fonts: { display: 'playfair', body: 'lora', accent: 'parisienne' },
    layout: 'crestTop',
    ornament: 'leafyWreath',
  },
  {
    id: 'vintage-teal',
    nameVi: 'Lam Cổ Điển',
    category: 'vintage',
    description: {
      vi: 'Xanh lam trầm, hơi thở châu Âu thế kỷ trước.',
      en: 'Deep teal with a last-century European air.',
      th: 'เขียวอมฟ้าเข้ม กลิ่นอายยุโรปยุคก่อน',
    },
    palette: { bg: '#e3ece9', surface: '#f4f8f6', primary: '#234440', accent: '#3f7d72', ink: '#2c4a45' },
    fonts: { display: 'cormorant', body: 'lora' },
    layout: 'archFrame',
    ornament: 'botanicalSprig',
  },
  {
    id: 'vintage-letter',
    nameVi: 'Thư Xưa',
    category: 'vintage',
    description: {
      vi: 'Như một bức thư tay cũ — mộc và hoài cổ.',
      en: 'Like an old handwritten letter — warm nostalgia.',
      th: 'เหมือนจดหมายเก่าเขียนด้วยมือ อบอวลความหลัง',
    },
    palette: { bg: '#efeae0', surface: '#fbf8f1', primary: '#3a352c', accent: '#8a6d4b', ink: '#4a4338' },
    fonts: { display: 'playfair', body: 'cormorant' },
    layout: 'bandedHeader',
    ornament: 'geoFrame',
  },

  // ── Cổ điển / Classic ───────────────────────────────────────────────────
  {
    id: 'classic-ivory',
    nameVi: 'Ngà Trang Nhã',
    category: 'classic',
    description: {
      vi: 'Trắng ngà và vàng đồng, chuẩn mực thanh lịch.',
      en: 'Ivory and antique gold — timeless elegance.',
      th: 'สีงาช้างกับทองเก่า สง่างามเหนือกาลเวลา',
    },
    palette: { bg: '#f6f3ec', surface: '#ffffff', primary: '#2a2722', accent: '#b69256', ink: '#3b372f' },
    fonts: { display: 'playfair', body: 'cormorant', accent: 'greatVibes' },
    layout: 'centeredClassic',
    ornament: 'monogramRing',
    ornamentSecondary: 'hairlineFlourish',
    accentStyle: 'gold',
  },
  {
    id: 'classic-navy-gold',
    nameVi: 'Hoàng Kim',
    category: 'classic',
    description: {
      vi: 'Xanh navy quyền quý, viền vàng kim lộng lẫy.',
      en: 'Regal navy with lavish gold trim.',
      th: 'น้ำเงินเนวีหรูหรา ขอบทองงามอร่าม',
    },
    palette: { bg: '#14213d', surface: '#1b2a4a', primary: '#f5f1e6', accent: '#d4af37', ink: '#e7e3d6' },
    fonts: { display: 'playfair', body: 'cormorant', accent: 'pinyonScript' },
    layout: 'framedBorder',
    ornament: 'geoFrame',
    accentStyle: 'gold',
  },
  {
    id: 'classic-bordeaux',
    nameVi: 'Rượu Vang',
    category: 'classic',
    description: {
      vi: 'Đỏ bordeaux ấm áp, đằm thắm và sang trọng.',
      en: 'Warm bordeaux red, graceful and stately.',
      th: 'แดงบอร์โดอบอุ่น นุ่มนวลและภูมิฐาน',
    },
    palette: { bg: '#efe7e4', surface: '#ffffff', primary: '#5a1f2a', accent: '#a6783f', ink: '#3a2b2b' },
    fonts: { display: 'cormorant', body: 'lora', accent: 'greatVibes' },
    layout: 'editorialAsym',
    ornament: 'monogramRing',
    ornamentSecondary: 'grandAmpersand',
  },

  // ── Hoa lá / Floral ─────────────────────────────────────────────────────
  {
    id: 'floral-peony',
    nameVi: 'Mẫu Đơn',
    category: 'floral',
    description: {
      vi: 'Sắc hồng mẫu đơn nở rộ, ngọt ngào nữ tính.',
      en: 'Blooming peony pink, sweet and feminine.',
      th: 'ชมพูโบตั๋นเบ่งบาน หวานละมุน',
    },
    palette: { bg: '#fbeef0', surface: '#ffffff', primary: '#6a3550', accent: '#c97a93', ink: '#4a3640' },
    fonts: { display: 'playfair', body: 'beVietnamPro', accent: 'dancingScript' },
    layout: 'crestTop',
    ornament: 'floralCorner',
    ornamentSecondary: 'leafyWreath',
  },
  {
    id: 'floral-eucalyptus',
    nameVi: 'Khuynh Diệp',
    category: 'floral',
    description: {
      vi: 'Lá khuynh diệp xanh dịu, tự nhiên và tươi mới.',
      en: 'Soft eucalyptus greens, fresh and natural.',
      th: 'เขียวยูคาลิปตัสอ่อน สดชื่นเป็นธรรมชาติ',
    },
    palette: { bg: '#eef3ee', surface: '#ffffff', primary: '#2f4035', accent: '#6f8f6a', ink: '#38453b' },
    fonts: { display: 'cormorant', body: 'lora' },
    layout: 'splitVertical',
    ornament: 'botanicalSprig',
    ornamentSecondary: 'leafyWreath',
  },
  {
    id: 'floral-watercolor',
    nameVi: 'Màu Nước',
    category: 'floral',
    description: {
      vi: 'Vệt màu nước tím lavender mơ màng, bay bổng.',
      en: 'Dreamy lavender watercolor washes.',
      th: 'สีน้ำลาเวนเดอร์ชวนฝัน ละมุนละไม',
    },
    palette: { bg: '#f3eff7', surface: '#ffffff', primary: '#45356a', accent: '#9a86c4', ink: '#3f3a4a' },
    fonts: { display: 'dancingScript', body: 'beVietnamPro' },
    layout: 'archFrame',
    ornament: 'watercolorBlob',
    ornamentSecondary: 'botanicalSprig',
  },

  // ── Truyền thống / Traditional Vietnamese ───────────────────────────────
  {
    id: 'vn-sen-vang',
    nameVi: 'Sen Vàng',
    category: 'vietnamese',
    description: {
      vi: 'Đỏ đô và sen vàng — đậm đà bản sắc Việt.',
      en: 'Deep red and golden lotus — Vietnamese soul.',
      th: 'แดงเข้มกับดอกบัวทอง จิตวิญญาณเวียดนาม',
    },
    palette: { bg: '#7a1220', surface: '#fbf5e6', primary: '#7a1220', accent: '#c9a227', ink: '#5a3a18' },
    fonts: { display: 'playfair', body: 'beVietnamPro' },
    layout: 'crestTop',
    ornament: 'lotus',
    ornamentSecondary: 'geoFrame',
    accentStyle: 'gold',
  },
  {
    id: 'vn-hong-phuc',
    nameVi: 'Hồng Phúc',
    category: 'vietnamese',
    description: {
      vi: 'Đỏ son truyền thống, song hỷ viền vàng.',
      en: 'Traditional vermilion with gilded borders.',
      th: 'แดงชาดแบบดั้งเดิม ขอบทองอร่าม',
    },
    palette: { bg: '#8c1c13', surface: '#fff8ef', primary: '#8c1c13', accent: '#d4af37', ink: '#5a2a1c' },
    fonts: { display: 'cormorant', body: 'beVietnamPro' },
    layout: 'framedBorder',
    ornament: 'lotus',
    ornamentSecondary: 'floralCorner',
    accentStyle: 'gold',
  },
  {
    id: 'vn-luc-binh',
    nameVi: 'Lục Bình',
    category: 'vietnamese',
    description: {
      vi: 'Xanh ngọc trầm và giấy gấm — nét Á Đông thanh tao.',
      en: 'Deep jade and brocade paper — serene Eastern grace.',
      th: 'เขียวหยกเข้มกับกระดาษลายผ้า งามสงบแบบตะวันออก',
    },
    palette: { bg: '#14322e', surface: '#f4efe2', primary: '#14322e', accent: '#c9a227', ink: '#2c3b34' },
    fonts: { display: 'playfair', body: 'beVietnamPro' },
    layout: 'bandedHeader',
    ornament: 'lotus',
    ornamentSecondary: 'botanicalSprig',
    accentStyle: 'gold',
  },

  // ── Mộc mạc / Rustic ────────────────────────────────────────────────────
  {
    id: 'rustic-kraft',
    nameVi: 'Mộc Mạc',
    category: 'rustic',
    description: {
      vi: 'Giấy kraft nâu nhạt, đơn sơ mà ấm cúng.',
      en: 'Kraft-paper warmth, simple and cozy.',
      th: 'กระดาษคราฟท์อบอุ่น เรียบง่ายน่ารัก',
    },
    palette: { bg: '#e9dfcd', surface: '#f3ead6', primary: '#44382a', accent: '#8a6a3f', ink: '#4d4030' },
    fonts: { display: 'montserrat', body: 'lora', accent: 'dancingScript' },
    layout: 'centeredClassic',
    ornament: 'botanicalSprig',
    ornamentSecondary: 'leafyWreath',
  },
  {
    id: 'rustic-greenery',
    nameVi: 'Đồng Nội',
    category: 'rustic',
    description: {
      vi: 'Cỏ cây đồng nội, xanh ô liu mộc mạc.',
      en: 'Meadow greenery, olive and earthy.',
      th: 'เขียวขจีกลางทุ่ง โทนมะกอกติดดิน',
    },
    palette: { bg: '#e7ead9', surface: '#f4f3e7', primary: '#36422a', accent: '#6b7d44', ink: '#3c4632' },
    fonts: { display: 'cormorant', body: 'beVietnamPro', accent: 'sacramento' },
    layout: 'crestTop',
    ornament: 'leafyWreath',
  },

  // ── Art Deco ────────────────────────────────────────────────────────────
  {
    id: 'deco-gold',
    nameVi: 'Gatsby Vàng',
    category: 'artdeco',
    description: {
      vi: 'Hình học Gatsby — đen tuyền dát vàng rực rỡ.',
      en: 'Gatsby geometry — jet black gilded in gold.',
      th: 'เรขาคณิตแบบแกตส์บี ดำสนิทเคลือบทอง',
    },
    palette: { bg: '#11151c', surface: '#161b24', primary: '#f3e9cf', accent: '#c9a227', ink: '#d8cfb4' },
    fonts: { display: 'montserrat', body: 'montserrat' },
    layout: 'framedBorder',
    ornament: 'artDecoFan',
    ornamentSecondary: 'geoFrame',
    accentStyle: 'gold',
  },
  {
    id: 'deco-emerald',
    nameVi: 'Ngọc Lục Bảo',
    category: 'artdeco',
    description: {
      vi: 'Xanh ngọc lục bảo sâu thẳm, quạt deco ánh kim.',
      en: 'Deep emerald with gleaming deco fans.',
      th: 'มรกตเข้มล้ำลึก พัดอาร์ตเดโคเปล่งประกาย',
    },
    palette: { bg: '#0d2a24', surface: '#103a31', primary: '#f1ead4', accent: '#cba35c', ink: '#d6cdab' },
    fonts: { display: 'playfair', body: 'montserrat' },
    layout: 'crestTop',
    ornament: 'artDecoFan',
    ornamentSecondary: 'monogramRing',
    accentStyle: 'gold',
  },
];

export function getDesignById(id: string): InvitationDesign | undefined {
  return INVITATION_DESIGNS.find((design) => design.id === id);
}
