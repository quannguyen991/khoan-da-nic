/**
 * QUẢ CẦU NÓI — hình chính của trang chủ.
 *
 * ⚠️ SỬA 20/9/2026 — bản trước vẽ micro và cột sóng bên trong quả cầu nên
 * màn chủ đọc ra như một nút ghi âm. Ảnh tham chiếu dùng một bong bóng tím
 * có khuôn mặt; hình này phải dạy đúng cho bác rằng đây là chỗ để kể chuyện.
 * Vẽ bằng SVG để giữ nét khi phóng to và không nướng chữ vào ảnh.
 */

type Props = {
  /** Đang thật sự nghe: chỉ lúc này vòng ngoài và hạt sáng mới chuyển động. */
  dangNghe?: boolean;
  /** Máy không nghe được: đứng im và xám lại để không nói dối trạng thái. */
  micHong?: boolean;
  /** Có đuôi bong bóng thoại ở trang chủ. */
  coDuoi?: boolean;
  /**
   * Trôi nổi nhẹ lên xuống — bong bóng "sống", như màn nói chuyện của ChatGPT.
   * Người dùng xin 24/9/2026 cho màn "Nói cho cháu nghe". Đây là trang trí, không
   * phải trạng thái: nó KHÔNG chạy khi `micHong` (quả cầu xám phải đứng im).
   */
  troiNoi?: boolean;
  /** Đang chờ lời đáp: quầng sáng thở chậm. Khác hẳn vòng sóng "đang nghe". */
  dangNghi?: boolean;
  className?: string;
};

const HAT_SANG = [
  { cx: 43, cy: 112, r: 3.5 },
  { cx: 158, cy: 82, r: 3 },
  { cx: 56, cy: 72, r: 2.5 },
  { cx: 146, cy: 120, r: 2.5 },
];

export function QuaCauNoi({
  dangNghe = false, micHong = false, coDuoi = true, troiNoi = false, dangNghi = false, className = '',
}: Props) {
  const dangSong = dangNghe && !micHong;
  const troi = troiNoi && !micHong;

  return (
    <div
      className={`relative ${troi ? 'animate-[troiNoi_4.2s_ease-in-out_infinite] motion-reduce:animate-none' : ''} ${className}`}
      aria-hidden="true"
    >
      {/* Bóng đổ mềm dưới đáy — co lại khi quả cầu nổi lên, cho cảm giác có khoảng trống bên dưới. */}
      {troi && (
        // Thân cầu kết thúc ở y=176/224 của viewBox (≈ 78%), nên bóng đặt ngay dưới đó.
        <span className="absolute left-1/2 -translate-x-1/2 bottom-[13%] w-[44%] h-[6%] rounded-[50%] bg-[#6d28d9]/25 blur-md animate-[bongDuoi_4.2s_ease-in-out_infinite] motion-reduce:animate-none" />
      )}
      {dangNghi && !micHong && (
        <span className="absolute inset-[6%] rounded-full bg-[#c4b5fd]/50 blur-xl animate-[thoCham_1.8s_ease-in-out_infinite] motion-reduce:animate-none" />
      )}
      {dangSong && [0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border-2 border-[#c4b5fd]/45 animate-[toaVong_2.4s_ease-out_infinite] motion-reduce:hidden"
          style={{ animationDelay: `${i * 0.8}s` }}
        />
      ))}

      <svg viewBox="0 0 200 224" className="w-full h-full relative" role="presentation">
        <defs>
          <radialGradient id="qcn-than" cx="42%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#d5c4ff" stopOpacity="0.98" />
            <stop offset="42%" stopColor="#9b6dff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#7440df" stopOpacity="0.92" />
          </radialGradient>
          <linearGradient id="qcn-bong" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.84" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="qcn-hao" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="#c4b5fd" stopOpacity="0.52" />
            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
          </radialGradient>
          <filter id="qcn-mo" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Các vòng sáng tĩnh khớp ảnh tham chiếu; chỉ vòng động phản ánh trạng thái nghe. */}
        <circle cx="100" cy="96" r="98" fill="url(#qcn-hao)" />
        {[78, 88, 98].map((r) => (
          <circle key={r} cx="100" cy="96" r={r} fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.5" />
        ))}

        {coDuoi && (
          <path
            d="M136 156 C150 172 156 184 150 191 C143 198 124 184 112 168 Z"
            fill={micHong ? '#94a3b8' : '#8150ea'}
          />
        )}

        <circle cx="100" cy="96" r="80" fill={micHong ? '#94a3b8' : 'url(#qcn-than)'} />
        <ellipse cx="72" cy="45" rx="43" ry="22" fill="url(#qcn-bong)" filter="url(#qcn-mo)" transform="rotate(-28 72 45)" />
        <ellipse cx="139" cy="53" rx="30" ry="10" fill="#ffffff" fillOpacity="0.2" transform="rotate(28 139 53)" />
        <circle cx="100" cy="96" r="80" fill="none" stroke="#ffffff" strokeOpacity="0.52" strokeWidth="2" />

        {/* Chấm sáng và sao — chi tiết tạo cảm giác nhân vật sống, không phải cái đĩa. */}
        <circle cx="62" cy="40" r="7" fill="#ffffff" fillOpacity="0.9" />
        <circle cx="48" cy="58" r="3.5" fill="#ffffff" fillOpacity="0.65" />
        <path d="M151 59 l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fff" fillOpacity="0.9" />
        <path d="M54 126 l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="#fff" fillOpacity="0.9" />

        {/* Khuôn mặt trong ảnh tham chiếu: mắt dọc và nụ cười nhỏ. */}
        <g fill="#ffffff" fillOpacity={micHong ? 0.48 : 0.96}>
          <rect x="70" y="83" width="18" height="28" rx="9" />
          <rect x="112" y="83" width="18" height="28" rx="9" />
          <path d="M88 121 Q100 133 112 121" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
        </g>

        {/* Hạt sáng chỉ nhịp khi bộ nghe thật sự đang chạy. */}
        {HAT_SANG.map((hat, i) => (
          <circle
            key={`${hat.cx}-${hat.cy}`}
            cx={hat.cx}
            cy={hat.cy}
            r={hat.r}
            fill="#fff"
            fillOpacity={micHong ? 0.3 : 0.82}
            className={dangSong ? 'animate-[songAm_1.1s_ease-in-out_infinite]' : undefined}
            style={dangSong ? { animationDelay: `${i * 0.16}s`, transformOrigin: `${hat.cx}px ${hat.cy}px` } : undefined}
          />
        ))}
      </svg>
    </div>
  );
}
