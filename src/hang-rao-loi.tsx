import React from 'react';

/**
 * ══════════════ HÀNG RÀO LỖI — ĐỪNG TRẢ VỀ KHOẢNG TRẮNG ══════════════
 *
 * ⚠️ VÌ SAO CẦN: React gỡ NGUYÊN CẢ NHÁNH khi một component ném lỗi lúc dựng.
 * Không có hàng rào thì thứ người dùng thấy là một ô trắng, không chữ, không
 * nút. Đo trên máy thật 20/8/2026: bấm Menu tác vụ và bấm popup trong app đều
 * chỉ ra khoảng trắng — và vì màn hình không nói gì, ba vòng chẩn đoán đầu tiên
 * đều đoán sai nguyên nhân (nghi CSS, nghi cú pháp JavaScript).
 *
 * Đây đúng là dạng lỗi §4.3, chỉ khác chỗ áp dụng: "không dựng được" bị hiện ra
 * y hệt "không có gì để hiện".
 *
 * ⚠️ HÀNG RÀO NÀY HIỆN NGUYÊN VĂN LỖI, KHÔNG NUỐT. Người cao tuổi không đọc
 * `TypeError` — nhưng người sửa máy giúp bác thì đọc được, và một dòng lỗi thật
 * đáng giá hơn ba vòng đoán mò. Câu đầu vẫn viết cho bác đọc.
 *
 * ⚠️ KHÔNG BAO GIỜ NUỐT LỖI RỒI RENDER `null`. Làm vậy là dựng lại đúng cái ô
 * trắng mà hàng rào này sinh ra để xoá bỏ.
 */
type Props = {
  children: React.ReactNode;
  /** Chữ cho bác đọc. Truyền từ catalog i18n — §4.1. */
  loiChinh?: string;
  loiPhu?: string;
  /** Nút thoát, nếu chỗ này có đường ra (ví dụ đóng popup). §4.6 */
  nhanThoat?: string;
  onThoat?: () => void;
};

type State = { loi: Error | null; chiTiet: string };

export class HangRaoLoi extends React.Component<Props, State> {
  state: State = { loi: null, chiTiet: '' };

  static getDerivedStateFromError(loi: Error): Partial<State> {
    return { loi };
  }

  componentDidCatch(loi: Error, info: React.ErrorInfo) {
    // Vào log để còn lấy được qua `adb logcat` hoặc devtools.
    console.error('[hang-rao-loi]', loi?.message, info?.componentStack);
    this.setState({ chiTiet: String(info?.componentStack || '').split('\n').slice(0, 4).join('\n') });
  }

  render() {
    const { loi, chiTiet } = this.state;
    if (!loi) return this.props.children as React.ReactElement;

    return (
      <div className="w-full h-full min-h-[240px] flex flex-col items-center justify-center gap-3 p-5 text-center bg-[#f8f4ff]">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-[28px]">
          ⚠️
        </div>
        <h3 className="text-[18px] font-black text-[#2e1065] leading-snug">
          {this.props.loiChinh ?? 'Phần này chưa mở được'}
        </h3>
        <p className="text-[14px] text-slate-600 leading-snug max-w-xs">
          {this.props.loiPhu ?? 'Các phần khác của Khoan Đã vẫn dùng được bình thường.'}
        </p>

        {/*
          Khối kỹ thuật: bác không cần đọc, nhưng nó là thứ duy nhất nói được
          VÌ SAO. Để nguyên văn, không dịch, không rút gọn.
        */}
        <details className="w-full max-w-xs mt-1 text-left">
          <summary className="text-[14px] font-bold text-[#6d28d9] cursor-pointer">
            Chi tiết kỹ thuật
          </summary>
          <pre className="mt-2 p-2.5 bg-white border border-purple-100 rounded-xl text-[12px] text-slate-700 whitespace-pre-wrap break-words max-h-40 overflow-auto">
{String(loi?.message || loi)}
{chiTiet ? '\n' + chiTiet : ''}
          </pre>
        </details>

        {this.props.onThoat && (
          <button
            onClick={this.props.onThoat}
            className="mt-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#9e76ea] via-[#ad8af0] to-[#9e76ea] text-white font-bold text-[15px] active:scale-95 transition-transform"
          >
            {this.props.nhanThoat ?? 'Đóng'}
          </button>
        )}
      </div>
    );
  }
}
