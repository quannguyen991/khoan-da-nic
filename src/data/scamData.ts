/**
 * BÀI HỌC CHỐNG LỪA ĐẢO — tải cùng màn Bài học, không nằm trong gói chính.
 * Kiểu và số khẩn cấp nằm ở `so-khan-cap.ts`; xem chú thích ở đó.
 */

export type { EmergencyContact, ScamLesson } from './so-khan-cap';
export { EMERGENCY_NUMBERS } from './so-khan-cap';
import type { ScamLesson } from './so-khan-cap';

export const SCAM_LESSONS: Record<'vi' | 'en', ScamLesson[]> = {
  vi: [
    {
      id: 'vi-police-impersonation',
      category: 'impersonation',
      title: 'Chiêu giả danh Công an / Viện kiểm sát dọa phong tỏa tài sản',
      shortDesc: 'Kẻ lừa đảo xưng là cán bộ công an, đọc đúng tên và CCCD, dọa bắt giam và ép chuyển tiền bảo lãnh.',
      dangerLevel: 'CAO',
      iconType: 'shield-alert',
      tags: ['Cảnh sát giả mạo', 'Ép chuyển tiền', 'Tài khoản an toàn'],
      readTime: '2 phút đọc',
      scenario: {
        story: 'Bác nhận cuộc gọi tự xưng Trung úy thuộc Phòng Điều tra Công an, thông báo tài khoản ngân hàng của bác liên quan đường dây buôn ma túy và rửa tiền 20 tỷ. Họ yêu cầu bác giữ bí mật tuyệt đối, không kể với con cháu, và chuyển toàn bộ sổ tiết kiệm vào "Tài khoản tạm giữ của cơ quan điều tra" trong 30 phút để kiểm tra.',
        scammerQuote: '"Bác đang bị điều tra đặc biệt. Bác phải nộp 100 triệu vào số tài khoản thanh tra của chúng tôi ngay để chứng minh trong sạch, nếu không sẽ có lệnh bắt tạm giam lúc 5 giờ chiều nay!"'
      },
      redFlags: [
        'Cơ quan công an, viện kiểm sát KHÔNG BAO GIỜ làm việc qua điện thoại hay yêu cầu chuyển tiền.',
        'Kẻ gian luôn hối thúc thời gian gấp (trong 15-30 phút) và đe dọa bằng án tù.',
        'Yêu cầu nạn nhân giữ bí mật, vào phòng đóng kín cửa, không cho người thân hay con cái biết.',
        'Đòi hỏi cung cấp mã OTP ngân hàng, mật khẩu hoặc số dư tài khoản tiết kiệm.'
      ],
      goldenRules: [
        'BẬT QUY TẮC "KHOAN ĐÃ": Lập tức cúp máy khi nghe người lạ tự xưng công an đòi tiền.',
        'Không chuyển bất kỳ đồng tiền nào vào bất cứ số tài khoản cá nhân nào.',
        'Gọi ngay cho con cái hoặc ra trực tiếp Công an phường/xã gần nhất để trình báo.'
      ],
      quiz: {
        question: 'Nếu có người xưng là Công an gọi điện bảo tài khoản của bác liên quan tội phạm và yêu cầu chuyển tiền gấp để chứng minh vô tội, bác nên làm gì?',
        options: [
          {
            text: 'Cúp máy ngay lập tức, không chuyển tiền và báo cho con cái hoặc công an phường.',
            isCorrect: true,
            explanation: 'Chính xác! Cơ quan pháp luật không bao giờ yêu cầu công dân chuyển tiền để chứng minh vô tội.'
          },
          {
            text: 'Lập tức ra ngân hàng rút tiết kiệm chuyển vào tài khoản họ cung cấp để tránh bị bắt.',
            isCorrect: false,
            explanation: 'Rất nguy hiểm! Đây là 100% bẫy lừa đảo chiếm đoạt toàn bộ tiền tiết kiệm.'
          },
          {
            text: 'Đọc mã OTP gửi về máy để họ tự hủy lệnh điều tra.',
            isCorrect: false,
            explanation: 'Không được! Đọc OTP là bác sẽ bị kẻ gian rút sạch tiền trong tài khoản.'
          }
        ]
      }
    },
    {
      id: 'vi-bank-otp-phishing',
      category: 'bank',
      title: 'Tin nhắn giả mạo Ngân hàng kèm link nâng cấp sinh trắc học / khóa thẻ',
      shortDesc: 'Tin nhắn mạo danh brandname ngân hàng, dọa tài khoản bị trừ tiền hoặc lỗi sinh trắc học để trộm mã OTP.',
      dangerLevel: 'CAO',
      iconType: 'landmark',
      tags: ['SMS Brandname', 'Mã OTP', 'Sinh trắc học'],
      readTime: '2 phút đọc',
      scenario: {
        story: 'Bác nhận tin nhắn hiển thị tên ngân hàng: "Tài khoản của quý khách vừa bị trừ 35.000.000đ tại nước ngoài. Nếu không phải bạn, hãy truy cập link vcb-xacthuc-sinhtrachoc.com để hủy giao dịch và hoàn tiền".',
        scammerQuote: '"Quý khách vui lòng nhập tên đăng nhập, mật khẩu và mã OTP 6 số để kích hoạt lại tài khoản trước khi bị khóa vĩnh viễn."'
      },
      redFlags: [
        'Đường link có đuôi lạ: .xyz, .top, .vip hoặc có thêm dấu gạch ngang (vietcombank-xacthuc.com).',
        'Trang web yêu cầu nhập mật khẩu ngân hàng và mã OTP.',
        'Tổng đài viên ngân hàng không bao giờ yêu cầu khách hàng cung cấp mã OTP hay mật khẩu.'
      ],
      goldenRules: [
        'TUYỆT ĐỐI KHÔNG ấn vào bất kỳ đường link nào gửi qua SMS hoặc Zalo.',
        'Mã OTP là chìa khóa két sắt cá nhân - Không bao giờ chia sẻ cho bất kỳ ai.',
        'Nếu nghi ngờ thẻ bị lộ, hãy mở ứng dụng ngân hàng chính thức trên máy và bấm khóa thẻ ngay.'
      ],
      quiz: {
        question: 'Khi nhận được tin nhắn báo tài khoản ngân hàng bị trừ tiền kèm đường link yêu cầu đăng nhập, bác xử lý thế nào?',
        options: [
          {
            text: 'Không bấm vào link, mở trực tiếp app ngân hàng trên máy hoặc nhờ con cháu kiểm tra.',
            isCorrect: true,
            explanation: 'Đúng chuẩn! Không truy cập link lạ trong tin nhắn để tránh bị mất tài khoản.'
          },
          {
            text: 'Bấm vào link ngay để hủy giao dịch và nhập mã OTP xác nhận.',
            isCorrect: false,
            explanation: 'Bấm vào link sẽ bị đánh cắp tài khoản và mã OTP.'
          }
        ]
      }
    },
    {
      id: 'vi-deepfake-voice-emergency',
      category: 'family',
      title: 'Deepfake AI giả giọng nói & Video người thân gặp nạn cần tiền mổ gấp',
      shortDesc: 'Kẻ lừa đảo dùng công nghệ trí tuệ nhân tạo ghép giọng nói và khuôn mặt người thân giục chuyển tiền cấp cứu.',
      dangerLevel: 'CAO',
      iconType: 'users',
      tags: ['Deepfake AI', 'Cấp cứu bệnh viện', 'Tống tiền cảm xúc'],
      readTime: '3 phút đọc',
      scenario: {
        story: 'Số lạ gọi đến, giọng nói hốt hoảng giống hệt con trai: "Bố ơi, con bị tai nạn giao thông trên đường, máu chảy nhiều lắm, bác sĩ yêu cầu đóng 40 triệu viện phí mổ gấp. Bố chuyển ngay vào số tài khoản bác sĩ cấp cứu này giúp con với!". Sau đó kẻ gian đưa video call chập chờn 3 giây hiện mặt con trai rồi tắt ngúm.',
        scammerQuote: '"Bác sĩ trưởng khoa đây, bệnh nhân đang rất nguy kịch, gia đình chuyển tiền viện phí ngay trong 5 phút kẻo trễ giờ vàng cấp cứu!"'
      },
      redFlags: [
        'Cuộc gọi video thường bị mờ, giật lag, khuôn mặt cử động đơ cứng và tắt rất nhanh (chỉ vài giây).',
        'Đánh vào lòng thương con cháu, tạo bối cảnh nguy cấp để bác mất bình tĩnh.',
        'Yêu cầu chuyển tiền vào số tài khoản người lạ (tự xưng là bác sĩ/công an giao thông).'
      ],
      goldenRules: [
        'Bình tĩnh thở sâu, cúp máy và bấm gọi trực tiếp vào SỐ ĐIỆN THOẠI QUEN THUỘC của người thân.',
        'Liên hệ ngay với người thân khác trong gia đình (vợ/chồng của con, đồng nghiệp) để xác minh.',
        'Hỏi một câu hỏi bí mật chỉ gia đình mới biết (ví dụ: Tên trường mẫu giáo của cháu nội là gì).'
      ],
      quiz: {
        question: 'Khi nhận cuộc gọi giọng giống con cháu báo bị tai nạn nguy kịch cần chuyển tiền gấp, bước đầu tiên bác cần làm là gì?',
        options: [
          {
            text: 'Bình tĩnh cúp máy và gọi lại ngay vào số điện thoại hàng ngày của con để kiểm chứng.',
            isCorrect: true,
            explanation: 'Chính xác! Luôn gọi lại số thật của người thân để phá vỡ bẫy Deepfake.'
          },
          {
            text: 'Chuyển ngay tiền theo số tài khoản lạ mà người gọi cung cấp vì sợ con nguy hiểm.',
            isCorrect: false,
            explanation: 'Tuyệt đối không! Đây là chiêu trò đánh vào tâm lý hoảng loạn của cha mẹ.'
          }
        ]
      }
    },
    {
      id: 'vi-malware-fake-vneid',
      category: 'tech',
      title: 'Lừa cài app Dịch vụ công / VNeID giả mạo chứa mã độc chiếm quyền máy',
      shortDesc: 'Kẻ gian hướng dẫn tải file .apk lạ để "cập nhật định danh mức 2", sau đó mã độc tự động đọc mã OTP và chuyển sạch tiền.',
      dangerLevel: 'CAO',
      iconType: 'laptop',
      tags: ['Mã độc APK', 'VNeID giả', 'Chiếm quyền điều khiển'],
      readTime: '2.5 phút đọc',
      scenario: {
        story: 'Kẻ lừa đảo gọi tự xưng cán bộ Công an quận, báo tài khoản VNeID của bác bị lỗi sai thông tin cư trú, yêu cầu truy cập website dịch vụ công giả và cài đặt file cài đặt "dichvucong.apk" để cán bộ hỗ trợ sửa từ xa.',
        scammerQuote: '"Bác chỉ cần tải file này về, cấp quyền Trợ năng (Accessibility) để hệ thống tự động đồng bộ căn cước cho bác, không cần phải lên phường xếp hàng."'
      },
      redFlags: [
        'Hướng dẫn tải file đuôi .apk ngoài cửa hàng Google Play / App Store.',
        'Yêu cầu cấp quyền "Trợ năng" (Accessibility Service) hoặc quyền "Xem màn hình".',
        'Sau khi cài, điện thoại có hiện tượng nóng máy, đơ màn hình và tự động thực hiện giao dịch.'
      ],
      goldenRules: [
        'CHỈ cài đặt ứng dụng từ Google Play hoặc App Store chính thống.',
        'Cán bộ công an KHÔNG BAO GIỜ gửi file cài đặt qua Zalo hoặc yêu cầu cài app lạ.',
        'Nếu lỡ cài: Lập tức TẮT WIFI / 4G hoặc TẮT NGUỒN máy ngay lập tức và gọi ngân hàng khóa tài khoản.'
      ],
      quiz: {
        question: 'Người tự xưng công an gửi link qua Zalo bảo bác tải file .apk về cài để sửa lỗi CCCD, bác làm thế nào?',
        options: [
          {
            text: 'Tuyệt đối không tải, xóa tin nhắn và nếu cần thì ra trực tiếp trụ sở Công an phường để hỏi.',
            isCorrect: true,
            explanation: 'Rất chính xác! Cơ quan nhà nước không bao giờ gửi file .apk ngoài kho ứng dụng.'
          },
          {
            text: 'Tải về và bấm cho phép mọi quyền để đỡ phải đi lại vất vả.',
            isCorrect: false,
            explanation: 'Cực kỳ nguy hiểm! File apk này là mã độc chiếm quyền điều khiển tài khoản ngân hàng.'
          }
        ]
      }
    },
    {
      id: 'vi-fake-job-investment',
      category: 'job_reward',
      title: 'Bẫy làm cộng tác viên TikTok/Shopee & Sàn đầu tư lãi suất cao 50%/tháng',
      shortDesc: 'Mời tham gia làm nhiệm vụ xem video, nạp tiền cọc ban đầu được trả hoa hồng nhỏ, sau đó bị giam toàn bộ vốn lớn.',
      dangerLevel: 'CAO',
      iconType: 'gift',
      tags: ['Việc nhẹ lương cao', 'Nhiệm vụ Shopee', 'Sàn chứng khoán ảo'],
      readTime: '2 phút đọc',
      scenario: {
        story: 'Bác được thêm vào nhóm Zalo "Hội người cao tuổi kiếm thêm thu nhập tại nhà". Ban đầu làm nhiệm vụ bấm like video TikTok được trả 50.000đ thật vào tài khoản. Sau đó họ bảo tham gia gói nhiệm vụ VIP nạp 50 triệu nhận về 85 triệu, nhưng khi nạp xong thì báo "lỗi hệ thống" và ép nạp thêm 100 triệu để rút vốn.',
        scammerQuote: '"Bác chỉ cần nạp thêm 30% tiền phí xác minh là hệ thống sẽ giải ngân toàn bộ 200 triệu cả gốc lẫn lãi về tài khoản bác trong 5 phút."'
      },
      redFlags: [
        'Không có công việc nào "việc nhẹ, ngồi nhà bấm like mà kiếm tiền triệu mỗi ngày".',
        'Mồi nhử: Ban đầu cho ăn lãi vài chục ngàn để lấy lòng tin, sau đó dụ số tiền lớn.',
        'Khi muốn rút tiền thì luôn đưa ra lý do: sai cú pháp, tiền phạt thuế, phải nạp thêm tiền đối ứng.'
      ],
      goldenRules: [
        'Không có bữa ăn nào miễn phí - Cảnh giác tuyệt đối với lời mời đầu tư lãi suất bất thường.',
        'Dừng nạp tiền ngay lập tức khi đối tượng bắt đóng phí để rút vốn (càng nạp càng mất).',
        'Rời khỏi các hội nhóm đầu tư lạ trên Zalo / Telegram.'
      ],
      quiz: {
        question: 'Khi tham gia nhóm làm nhiệm vụ nạp tiền và được yêu cầu nạp thêm 20 triệu để rút số tiền cũ về, bác xử lý thế nào?',
        options: [
          {
            text: 'Dừng ngay lập tức, không nạp thêm bất kỳ đồng nào vì đây là chiêu trò bòn rút tiền.',
            isCorrect: true,
            explanation: 'Chính xác! Nạp thêm tiền sẽ chỉ làm bác mất thêm tiền mà thôi.'
          },
          {
            text: 'Đi vay mượn để nạp thêm cho đủ điều kiện rút tiền về.',
            isCorrect: false,
            explanation: 'Sai lầm! Kẻ gian sẽ tiếp tục tạo ra lỗi khác để bắt bác nạp thêm.'
          }
        ]
      }
    }
  ],
  en: [
    {
      id: 'en-irs-arrest-scam',
      category: 'impersonation',
      title: 'IRS & Law Enforcement Arrest Threat Scam',
      shortDesc: 'Scammers pose as IRS agents or US Marshals threatening immediate arrest over unpaid taxes unless paid via gift cards or crypto.',
      dangerLevel: 'CAO',
      iconType: 'shield-alert',
      tags: ['IRS Impersonation', 'Arrest Threat', 'Gift Card Scam'],
      readTime: '2 min read',
      scenario: {
        story: 'You receive an urgent phone call from someone claiming to be Officer Davis from the IRS Criminal Investigation Division. They state that your Social Security Number is linked to unpaid back taxes of $4,850. They order you to stay on the line, drive to Target or a Bitcoin ATM immediately, and purchase gift cards to settle the federal warrant before police arrive at your home.',
        scammerQuote: '"A warrant for your arrest has been signed by the federal magistrate. If you hang up or notify anyone, deputies will be dispatched to your address in 20 minutes."'
      },
      redFlags: [
        'The IRS will NEVER call demand immediate payment over the phone or threaten law enforcement arrest.',
        'The IRS NEVER accepts Target, Apple, Walmart gift cards, Western Union wires, or Bitcoin.',
        'Demand that you stay on the phone continuously while driving to stores.',
        'High pressure tactics to prevent you from consulting family or financial advisors.'
      ],
      goldenRules: [
        'PAUSE & HANG UP: The real IRS communicates primarily via official mail sent by the US Postal Service.',
        'Never buy gift cards or cryptocurrency to pay any government agency.',
        'Report the call immediately to the FTC at ReportFraud.ftc.gov or call 1-877-FTC-HELP.'
      ],
      quiz: {
        question: 'An aggressive caller claiming to be from the IRS demands you buy $2,000 in gift cards to clear an arrest warrant. What should you do?',
        options: [
          {
            text: 'Hang up immediately and contact the official IRS or local police on verified numbers.',
            isCorrect: true,
            explanation: 'Correct! Government agencies never demand payment via gift cards or phone transfers.'
          },
          {
            text: 'Follow their instructions and read the gift card PIN numbers to avoid arrest.',
            isCorrect: false,
            explanation: 'Dangerous! Gift card PINs are completely untraceable once read to scammers.'
          }
        ]
      }
    },
    {
      id: 'en-pig-butchering-crypto',
      category: 'bank',
      title: 'Pig Butchering & Fake Cryptocurrency Investment Scam',
      shortDesc: 'Scammers build weeks of friendly trust or romance online, show manipulated high-yield profits, and lock your entire life savings.',
      dangerLevel: 'CAO',
      iconType: 'landmark',
      tags: ['Sha Zhu Pan', 'Crypto Fraud', 'Romance Scam'],
      readTime: '3 min read',
      scenario: {
        story: 'An attractive stranger accidentally texts you on WhatsApp: "Hi, is this David the golf instructor?". After apologizing for the wrong number, they start friendly daily conversations about life and family. Weeks later, they show screenshots of making $15,000 a week trading crypto on a special platform, offering to mentor you. After you deposit $50,000, your balance shows $120,000, but when you attempt to withdraw, they demand $25,000 in "capital gains tax".',
        scammerQuote: '"My uncle is a senior market analyst with insider signals. You can test with just $1,000 first, I promise you 30% weekly profit guaranteed."'
      },
      redFlags: [
        'Unsolicited text message from an unknown number that evolves into friendly daily chats or romance.',
        'Guaranteed high returns with "zero risk" on unfamiliar crypto exchanges or custom apps.',
        'The platform allows you to withdraw small amounts initially to build confidence, then freezes big deposits.',
        'Demanding extra fees, taxes, or margin deposits before allowing withdrawals.'
      ],
      goldenRules: [
        'Never invest money on websites or apps suggested by people you only know online.',
        'Legitimate investments NEVER guarantee fixed 20-50% returns with zero risk.',
        'Stop sending money immediately if a platform asks for additional taxes to release your balance.'
      ],
      quiz: {
        question: 'An online friend invites you to invest in a cryptocurrency platform promising guaranteed 40% returns. What should you do?',
        options: [
          {
            text: 'Decline and cease communication. Guaranteed high returns from online acquaintances are 100% scams.',
            isCorrect: true,
            explanation: 'Spot on! This is the hallmark pattern of Pig Butchering (Sha Zhu Pan) scams.'
          },
          {
            text: 'Deposit your retirement savings because they let you withdraw $100 easily during the test.',
            isCorrect: false,
            explanation: 'No! Scammers allow tiny test withdrawals specifically to bait your life savings.'
          }
        ]
      }
    },
    {
      id: 'en-tech-support-remote-desktop',
      category: 'tech',
      title: 'Microsoft / Apple Tech Support Remote Desktop Scam',
      shortDesc: 'Fake browser popups with loud beeping alarms urge victims to call a toll-free number, granting hackers remote access to bank accounts.',
      dangerLevel: 'CAO',
      iconType: 'laptop',
      tags: ['Fake Virus Alert', 'AnyDesk / UltraViewer', 'Remote Banking Hijack'],
      readTime: '2 min read',
      scenario: {
        story: 'While browsing recipes or news, your computer screen suddenly freezes with flashing red warnings and loud sirens: "SYSTEM CRITICAL ALERT: YOUR COMPUTER HAS BEEN INFECTED WITH TROJAN SPYWARE. CALL MICROSOFT SUPPORT AT 1-800-XXX-XXXX NOW". When you call, a technician instructs you to install AnyDesk. Once connected, they black out your screen and initiate unauthorized bank wire transfers.',
        scammerQuote: '"Your IP address was compromised by foreign hackers. Please log into your online banking so I can secure your funds in a federal protection server."'
      },
      redFlags: [
        'Microsoft, Apple, and Google NEVER display phone numbers on error screens or call you about computer viruses.',
        'Requests to download remote access software like AnyDesk, TeamViewer, or LogMeIn.',
        'The technician asks you to open your online bank account while they are connected remotely.'
      ],
      goldenRules: [
        'Do NOT call the phone number on popups. Press Ctrl+Alt+Delete (or Command+Option+Esc) to close your browser.',
        'Never allow an unsolicited caller or popup technician remote access to your computer.',
        'If you granted access: Turn off your computer immediately and call your bank from another phone.'
      ],
      quiz: {
        question: 'A browser popup locks your screen with a loud alarm saying your PC is infected and to call 1-800-MICROSOFT. What should you do?',
        options: [
          {
            text: 'Do not call. Force close the browser tab or restart your computer.',
            isCorrect: true,
            explanation: 'Exactly right! Legitimate tech giants never place phone numbers on browser security warnings.'
          },
          {
            text: 'Call the number and let the technician remotely fix your computer and inspect your bank.',
            isCorrect: false,
            explanation: 'Extreme danger! Giving remote access allows criminals to drain your bank accounts.'
          }
        ]
      }
    },
    {
      id: 'en-grandchild-bail-scam',
      category: 'family',
      title: 'Grandparent & Family Emergency AI Voice Cloning Scam',
      shortDesc: 'Scammers use AI voice synthesis to mimic your grandchild crying that they caused a fatal car wreck and need urgent bail money.',
      dangerLevel: 'CAO',
      iconType: 'users',
      tags: ['Grandparent Scam', 'AI Voice Clone', 'Urgent Bail Bond'],
      readTime: '2.5 min read',
      scenario: {
        story: 'You receive a frantic call. The voice sounds unmistakably like your grandson Michael: "Grandma, please don’t tell mom and dad! I was in a bad accident with a pregnant woman and the police locked me in jail. My public defender Mr. Miller is right here, he needs $7,500 cash bail sent via courier right now!".',
        scammerQuote: '"Ma’am, this is Attorney Miller. There is a gag order on this case. You must get the cash from your bank and hand it to our bonded courier in 45 minutes."'
      },
      redFlags: [
        'Extreme urgency combined with strict demands for secrecy ("Don’t tell my parents").',
        'Demanding cash pickup via courier, Western Union wire, or cryptocurrency.',
        'Emotional manipulation exploiting your love and protective instincts for family members.'
      ],
      goldenRules: [
        'HANG UP and dial your grandchild’s actual phone number directly to verify their safety.',
        'Call their parents (your children) or siblings immediately before transferring any money.',
        'Establish a secret family safety passphrase that only real family members know.'
      ],
      quiz: {
        question: 'You get a call from someone sounding like your grandchild begging for immediate bail money. What is your best first move?',
        options: [
          {
            text: 'Hang up and immediately call the grandchild or their parents on their known phone number.',
            isCorrect: true,
            explanation: 'Perfect! Always independently verify through existing trusted contact channels.'
          },
          {
            text: 'Rush to the bank, withdraw cash, and hand it to the courier to keep it secret.',
            isCorrect: false,
            explanation: 'Do not do this! Couriers and bail scams target grandparents to steal life savings.'
          }
        ]
      }
    },
    {
      id: 'en-bank-fraud-zelle-phishing',
      category: 'bank',
      title: 'Bank Fraud Department & Zelle / Wire Transfer Scam',
      shortDesc: 'Fake text alerts asking if you authorized a large Zelle transfer, followed by a spoofed bank call instructing you to send money to a "safe account".',
      dangerLevel: 'CAO',
      iconType: 'mail-warning',
      tags: ['Bank Impersonation', 'Zelle Reversal Scam', 'Spoofed Caller ID'],
      readTime: '2 min read',
      scenario: {
        story: 'You receive an SMS: "CHASE FRAUD ALERT: Did you attempt a $1,800 Zelle to John Smith? Reply YES or NO". When you reply NO, your phone rings showing caller ID "Chase Fraud Dept". The representative tells you your account has been breached and to "reverse" the unauthorized transaction by sending $1,800 to your own phone number via Zelle.',
        scammerQuote: '"To secure your funds, we need you to send a transfer to our internal reserve account. You will receive an SMS OTP, please read it back to confirm."'
      },
      redFlags: [
        'Caller asks you to transfer money to "protect it" or send money to yourself via Zelle/wire.',
        'Representative asks you to read back a multi-factor authentication code (OTP) sent to your phone.',
        'Spoofed caller ID mimicking your real bank’s customer service phone number.'
      ],
      goldenRules: [
        'Banks NEVER ask you to transfer funds to a "safe account" or ask you to send money via Zelle to reverse fraud.',
        'Never read 2-Factor Authentication (OTP) codes to anyone over the phone.',
        'Hang up and call the customer service number on the back of your physical debit/credit card.'
      ],
      quiz: {
        question: 'Your bank’s fraud department calls asking you to transfer funds to a "safe internal account" to cancel a hack. What should you do?',
        options: [
          {
            text: 'Refuse, hang up, and call the phone number printed on the back of your debit card.',
            isCorrect: true,
            explanation: '100% correct! Banks never ask you to transfer money to prevent theft.'
          },
          {
            text: 'Send the Zelle transfer and read the OTP to ensure your account is protected.',
            isCorrect: false,
            explanation: 'Wrong! Sending that transfer gives your money directly to the scammers.'
          }
        ]
      }
    },
    {
      id: 'en-usps-delivery-smishing',
      category: 'job_reward',
      title: 'USPS / FedEx / DHL Package Delivery Smishing Scam',
      shortDesc: 'Fake delivery notification texts claiming an address error, luring victims into entering credit card credentials on spoofed phishing portals.',
      dangerLevel: 'NGHI_NGO',
      iconType: 'gift',
      tags: ['USPS Phishing', 'Package Tracking', 'Card Theft'],
      readTime: '1.5 min read',
      scenario: {
        story: 'You receive a text: "USPS Notification: Your package could not be delivered due to an incomplete street number. Please update your delivery address at usps-redelivery-post.top and pay a $0.35 redelivery fee". The page looks identical to the official USPS website and steals your credit card number, CVV, and billing address.',
        scammerQuote: '"Your parcel is waiting at the regional depot. Redelivery must be confirmed within 12 hours or package will be returned to sender."'
      },
      redFlags: [
        'Links using unofficial domain endings (.top, .xyz, -tracking.com, usps-update.net).',
        'Asking for credit card details to pay tiny $0.30 redelivery fees.',
        'Received even when you have not ordered any recent package.'
      ],
      goldenRules: [
        'Never click links in package delivery SMS messages.',
        'Check tracking status only by copying the tracking number into official websites like usps.com or fedex.com.',
        'Delete and block the sender number immediately.'
      ],
      quiz: {
        question: 'You receive an SMS saying your package is held due to a missing street address with a link to pay $0.35. How do you handle it?',
        options: [
          {
            text: 'Do not click the link. If you are expecting a package, check directly on the official carrier website.',
            isCorrect: true,
            explanation: 'Correct! USPS and major couriers do not text from random numbers demanding small redelivery fees.'
          },
          {
            text: 'Click the link and input your credit card number since $0.35 is very cheap.',
            isCorrect: false,
            explanation: 'Dangerous! Scammers will use your card details to charge thousands in unauthorized purchases.'
          }
        ]
      }
    }
  ]
};
