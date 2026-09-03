/**
 * SỐ KHẨN CẤP VÀ HAI KIỂU DÙNG CHUNG.
 *
 * ⚠️ TÁCH KHỎI `scamData.ts` NGÀY 18/8/2026 VÌ LÝ DO TẢI TRANG, KHÔNG PHẢI
 * THẨM MỸ. Bài học chống lừa đảo (`SCAM_LESSONS`) là mấy chục nghìn ký tự chữ,
 * và trước đây nằm chung tệp với danh sách số khẩn cấp — nên toàn bộ bài học bị
 * kéo vào gói chính chỉ vì màn "Gia đình" cần vài số điện thoại.
 *
 * Tệp này ở lại gói chính (số khẩn cấp phải có ngay). `scamData.ts` giờ chỉ còn
 * bài học và đi cùng màn Bài học, tải khi bác mở tới.
 */
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  cleanPhone: string;
  agency: string;
  description: string;
  country: 'VN' | 'US' | 'UK' | 'AU' | 'CA' | 'GLOBAL';
  tag: string;
  badgeColor: string;
}

export interface ScamLesson {
  id: string;
  category: 'impersonation' | 'bank' | 'family' | 'tech' | 'job_reward';
  title: string;
  shortDesc: string;
  dangerLevel: 'CAO' | 'NGHI_NGO';
  iconType: 'shield-alert' | 'landmark' | 'users' | 'laptop' | 'gift' | 'phone-call' | 'mail-warning';
  tags: string[];
  readTime: string;
  scenario: {
    story: string;
    scammerQuote: string;
  };
  redFlags: string[];
  goldenRules: string[];
  quiz: {
    question: string;
    options: {
      text: string;
      isCorrect: boolean;
      explanation: string;
    }[];
  };
}

/**
 * ⚠️ §2B.5 — MỘT SỐ SAI ĐẨY NẠN NHÂN TỚI ĐÚNG KẺ LỪA ĐẢO.
 *
 * Đây là kịch bản hỏng tệ nhất của cả sản phẩm, và `verified-institution-registry.js`
 * tự ghi mình là "module nguy hiểm nhất trong backend" vì đúng chuyện này. Ba
 * luật của nó, áp cả ở đây:
 *   1. AI KHÔNG được tự tạo mục nào — mọi mục do người duyệt.
 *   2. KHÔNG lấy số từ nội dung người dùng gửi lên.
 *   3. Mục chưa duyệt thì KHÔNG được hiện ra như đã xác minh. Thà không có số
 *      còn hơn có số sai.
 *
 * ⚠️ HAI MỤC ĐÃ GỠ NGÀY 18/8/2026:
 *   · C02  `069.234.8560`
 *   · A05  `069.234.5860`
 * Hai số này chỉ khác nhau thứ tự vài chữ số — đúng hình dạng của một lần chép
 * rồi sửa tay — và không mục nào có nguồn. Chúng nằm ở `public/config/support-directory.json`
 * phần `_cho_duyet`: người duyệt mở trang chính thức, chép số, điền `sourceUrl`
 * + `verifiedAt`, đổi `reviewStatus` thành `approved`, rồi mới đưa trở lại.
 *
 * Những số CÒN LẠI dưới đây là số dịch vụ công ba chữ số (113 · 115 · 111 · 156)
 * và hotline chống lừa đảo quốc gia của các nước — loại số in trên báo, trên
 * truyền hình, và không đổi. Chúng vẫn nên được người duyệt đối chiếu một lượt.
 */
export const EMERGENCY_NUMBERS: Record<'vi' | 'en', EmergencyContact[]> = {
  vi: [
    {
      id: 'vn-police',
      name: 'Cảnh Sát 113',
      phone: '113',
      cleanPhone: '113',
      agency: 'Công an Nhân dân Việt Nam',
      description: 'Tiếp nhận tố giác tội phạm, đe dọa bắt cóc, tống tiền, lừa đảo chiếm đoạt tài sản khẩn cấp.',
      country: 'VN',
      tag: 'Khẩn cấp 24/7',
      badgeColor: 'bg-red-50 text-red-700 border-red-200'
    },
    {
      id: 'vn-spam-scam',
      name: 'Tổng Đài 156',
      phone: '156',
      cleanPhone: '156',
      agency: 'Bộ Thông tin & Truyền thông - Cục Viễn thông',
      description: 'Tổng đài quốc gia tiếp nhận phản ánh cuộc gọi rác, tin nhắn rác và các đầu số có dấu hiệu lừa đảo.',
      country: 'VN',
      tag: 'Báo số lừa đảo',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      id: 'vn-ambulance',
      name: 'Cấp Cứu 115',
      phone: '115',
      cleanPhone: '115',
      agency: 'Cấp cứu Y tế Quốc gia',
      description: 'Gọi khi có tình huống y tế khẩn cấp hoặc cần xác minh tin báo tai nạn từ người lạ.',
      country: 'VN',
      tag: 'Cấp cứu y tế',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'vn-protection-111',
      name: 'Tổng Đài Quốc Gia 111',
      phone: '111',
      cleanPhone: '111',
      agency: 'Cục Trẻ em & Bảo trợ Xã hội',
      description: 'Hỗ trợ tư vấn tâm lý, bảo vệ người cao tuổi và các đối tượng yếu thế trước bạo lực và lừa đảo.',
      country: 'VN',
      tag: 'Bảo vệ người già',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
    }
  ],
  en: [
    {
      id: 'us-911',
      name: 'Emergency 911',
      phone: '911',
      cleanPhone: '911',
      agency: 'US & Canada Emergency Dispatch',
      description: 'Immediate police dispatch for active threats, in-person coercion, extortion, or life safety emergencies.',
      country: 'US',
      tag: 'Immediate Dispatch 24/7',
      badgeColor: 'bg-red-50 text-red-700 border-red-200'
    },
    {
      id: 'us-ftc',
      name: 'US FTC Fraud Hotline',
      phone: '1-877-382-4357',
      cleanPhone: '18773824357',
      agency: 'Federal Trade Commission (ReportFraud.ftc.gov)',
      description: 'Official US government agency dedicated to tracking impersonation scams, identity theft, and telemarketing fraud.',
      country: 'US',
      tag: 'FTC Official Hotline',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'uk-action-fraud',
      name: 'UK Action Fraud',
      phone: '0300 123 2040',
      cleanPhone: '+443001232040',
      agency: 'National Fraud & Cyber Crime Reporting Centre (UK)',
      description: 'The UK central reporting center for scams, phishing emails, banking fraud, and online extortion.',
      country: 'UK',
      tag: 'UK Cyber Police',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      id: 'au-scamwatch',
      name: 'Australia Scamwatch',
      phone: '1300 795 995',
      cleanPhone: '1300795995',
      agency: 'Australian Competition and Consumer Commission (ACCC)',
      description: 'Australia’s national scam tracking agency for reporting investment scams, SMS phishing, and fake calls.',
      country: 'AU',
      tag: 'ACCC Australia',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      id: 'ca-antifraud',
      name: 'Canadian Anti-Fraud (CAFC)',
      phone: '1-888-495-8501',
      cleanPhone: '18884958501',
      agency: 'Royal Canadian Mounted Police & Competition Bureau',
      description: 'Canada’s central repository for intelligence, prevention, and enforcement against mass marketing scams.',
      country: 'CA',
      tag: 'Canada RCMP',
      badgeColor: 'bg-red-50 text-red-700 border-red-200'
    },
    {
      id: 'us-fbi-ic3',
      name: 'FBI IC3 / Cyber Division',
      phone: '1-800-225-5324',
      cleanPhone: '18002255324',
      agency: 'Internet Crime Complaint Center (IC3.gov)',
      description: 'Federal Bureau of Investigation center for wire fraud, cryptocurrency pig butchering, and elder financial abuse.',
      country: 'GLOBAL',
      tag: 'FBI Cyber Crime',
      badgeColor: 'bg-slate-900 text-white border-slate-700'
    }
  ]
};

