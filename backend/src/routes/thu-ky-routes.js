'use strict';
/**
 * ROUTER ĐỘC LẬP CHO "THƯ KÝ NGHE MÁY HỘ" (`/api/thu-ky/*`).
 *
 * - Cô lập dữ liệu theo tài khoản đã đăng nhập (`Bearer <token>`) hoặc phiên khách
 *   có chữ ký HMAC do máy chủ cấp (`POST /api/thu-ky/phien-khach`).
 * - Dùng chung thực thể kho duy nhất `KP.khoChung()` (không mở `moKho()` thứ hai).
 * - Bọc `asyncThuKy` cho toàn bộ handler bất đồng bộ (§6.7: không bao giờ treo/500 trắng).
 * - Không lộ trọng số chấm điểm nội bộ trên `/api/thu-ky/bo-luat`.
 */

const express = require('express');
const {
  taoQuanLyStoreThuKy,
  taoTokenPhienKhach,
  xacMinhTokenPhienKhach,
} = require('../thu-ky-nghe-may');
const {
  PHIEN_BAN_LUAT_THU_KY,
  BO_QUY_TAC_AN_TOAN,
  BO_LUAT_TIN_HIEU,
  CONG_HUONG_THU_KY,
} = require('../thu-ky-bo-luat');
const { BO_KICH_BAN_THU_KY, chayDanhGiaBoLuatThuKy } = require('../thu-ky-kich-ban');

const asyncThuKy = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('[thu-ky]', err?.message);
    if (!res.headersSent) {
      res.status(500).json({ maLoi: 'LOI_MAY_CHU' });
    }
  });
};

function taoRouterThuKy({ KP, TK, chanDoc, chanPhanTich, guiPushHaiPhia, guiThatFcmV1 }) {
  const router = express.Router();
  const quanLyThuKy = taoQuanLyStoreThuKy();

  // Cấp token phiên khách có chữ ký HMAC (không cần đăng nhập §5.3)
  router.post('/phien-khach', chanDoc, (req, res) => {
    res.json({ token: taoTokenPhienKhach() });
  });

  const ganStoreThuKy = asyncThuKy(async (req, res, next) => {
    let khoaPhien = '';
    let taiKhoanId = null;
    try {
      taiKhoanId = await KP.docPhien(req.headers.authorization);
      if (taiKhoanId) {
        khoaPhien = `tk:${taiKhoanId}`;
      }
    } catch {
      // Rơi xuống kiểm tra token phiên khách
    }

    if (!khoaPhien) {
      const rawSession = String(req.headers['x-thu-ky-session'] || '').trim();
      const idDaKy = xacMinhTokenPhienKhach(rawSession);
      if (!idDaKy) {
        return res.status(401).json({ ma: 'THIEU_HOAC_SAI_PHIEN_THU_KY' });
      }
      khoaPhien = `khach:${idDaKy}`;
    }

    const store = quanLyThuKy.layStore(khoaPhien);
    try {
      const kho = await KP.khoChung();
      await store.taiTuKho(kho);
    } catch {
      // §6.7: lỗi kho lưu trữ không được làm chết luồng bảo vệ cuộc gọi
    }
    req.thuKyStore = store;
    req.taiKhoanThuKyId = taiKhoanId;
    return next();
  });

  router.get('/cau-hinh', chanDoc, ganStoreThuKy, (req, res) => {
    res.json({ cauHinh: req.thuKyStore.layCauHinh() });
  });

  router.put('/cau-hinh', chanDoc, ganStoreThuKy, (req, res) => {
    const cauHinh = req.thuKyStore.capNhatCauHinh(req.body || {});
    res.json({ cauHinh });
  });

  router.post('/cuoc-goi/bat-dau', chanDoc, ganStoreThuKy, (req, res) => {
    const { soNguoiGoi, giaLap } = req.body || {};
    const phien = req.thuKyStore.batDauCuocGoi({ soNguoiGoi, giaLap });
    res.json({ phien });
  });

  router.post('/cuoc-goi/:id/luot', chanPhanTich, ganStoreThuKy, asyncThuKy(async (req, res) => {
    const { loiNoi, khongNgheRo, tuyChon } = req.body || {};
    const tuyChonSach = tuyChon && typeof tuyChon === 'object'
      ? {
          dungAi: tuyChon.dungAi === true,
          giaLapLoiAi: tuyChon.giaLapLoiAi === true,
        }
      : {};
    const kq = await req.thuKyStore.xuLyLuotNguoiGoi(req.params.id, {
      loiNoi,
      khongNgheRo: Boolean(khongNgheRo),
      tuyChon: tuyChonSach,
    });
    if (kq.error === 'NOT_FOUND') return res.status(404).json({ ma: 'KHONG_TIM_THAY_CUOC_GOI' });
    if (kq.error === 'CALL_ALREADY_ENDED') return res.status(409).json({ ma: 'CUOC_GOI_DA_KET_THUC', phien: kq.phien });

    // Nếu chủ tài khoản đã ghép với con cháu và cuộc gọi kết thúc ở mức CAO hoặc KHẨN CẤP -> báo đẩy tới vòng ghép
    if (
      req.taiKhoanThuKyId &&
      kq.ketThuc &&
      typeof guiPushHaiPhia === 'function' &&
      (kq.phien?.nhanRuiRo === 'CAO' || kq.phien?.trangThaiPhanLoai === 'khan_cap')
    ) {
      void (async () => {
        try {
          const kho = await KP.khoChung();
          const dsCon = await KP.danhSachDaGhep(req.taiKhoanThuKyId);
          if (!dsCon.length) return;
          const hs = TK ? await TK.layHoSo(kho, req.taiKhoanThuKyId).catch(() => null) : null;
          for (const conId of dsCon) {
            await guiPushHaiPhia({
              kho,
              nguoiNhanId: conId,
              payloadNguoiThan: {
                nhan: kq.phien?.nhanRuiRo === 'CAO' || kq.phien?.trangThaiPhanLoai === 'khan_cap' ? 'CAO' : 'NGHI_NGO',
                canhBaoId: `tk_${kq.phien.id}`,
                tenNguoiCaoTuoi: hs?.ten || null,
              },
              guiThat: req.app.get('guiPushThay') || undefined,
              guiThatNative: req.app.get('guiNativeThay') || guiThatFcmV1,
            });
          }
        } catch {
          // §6.7: không để lỗi push ảnh hưởng luồng cuộc gọi
        }
      })();
    }

    return res.json(kq);
  }));

  router.get('/cuoc-goi', chanDoc, ganStoreThuKy, (req, res) => {
    res.json({
      danhSach: req.thuKyStore.layDanhSachCuocGoi(),
      thongKeDoTre: req.thuKyStore.tinhThongKeDoTre(),
    });
  });

  router.post('/cuoc-goi/:id/nhan-kiem-tra', chanDoc, ganStoreThuKy, (req, res) => {
    const kq = req.thuKyStore.nhanKiemTra(req.params.id, req.body?.tenNguoiKiemTra);
    if (!kq) return res.status(404).json({ ma: 'KHONG_TIM_THAY_CUOC_GOI' });
    return res.json({ phien: kq });
  });

  router.post('/cuoc-goi/:id/danh-dau', chanDoc, ganStoreThuKy, (req, res) => {
    const kq = req.thuKyStore.danhDauCuocGoi(req.params.id, req.body?.ketQua);
    if (!kq) return res.status(400).json({ ma: 'DANH_DAU_KHONG_HOP_LE' });
    return res.json({ phien: kq });
  });

  router.post('/cuoc-goi/:id/xoa', chanDoc, ganStoreThuKy, (req, res) => {
    const ok = req.thuKyStore.xoaCuocGoi(req.params.id);
    if (!ok) return res.status(404).json({ ma: 'KHONG_TIM_THAY_CUOC_GOI' });
    return res.json({ daXoa: true });
  });

  /**
   * ĐƯỜNG DÀNH CHO CON CHÁU ĐÃ GHÉP CẶP (`GuardianView`):
   * - Chỉ tài khoản đang nằm trong vòng ghép của chủ tài khoản mới đọc/đánh dấu được;
   *   người lạ hoặc người đã bị thu hồi nhận 404 (§9.8).
   * - §6.9: chỉ trả tóm tắt & số đã che, không tự phơi hội thoại thô trừ khi bố mẹ tự bật `tom_tat_va_ban_ghi`.
   */
  router.get('/gia-dinh/cuoc-goi', chanDoc, asyncThuKy(async (req, res) => {
    const taiKhoanId = await KP.docPhien(req.headers.authorization);
    if (!taiKhoanId) return res.status(401).json({ maLoi: 'CHUA_DANG_NHAP' });
    const kho = await KP.khoChung();
    const ghep = await KP.capGhepCuaToi(taiKhoanId);
    const danhSachGop = [];

    for (const bo of ghep.chuTaiKhoan || []) {
      const store = quanLyThuKy.layStore(`tk:${bo.id}`);
      await store.taiTuKho(kho);
      const hs = TK ? await TK.layHoSo(kho, bo.id).catch(() => null) : null;
      const tenBoMe = hs?.ten || 'Bố mẹ';
      for (const cg of store.layDanhSachCuocGoi()) {
        danhSachGop.push({
          ...cg,
          chuTaiKhoanId: bo.id,
          tenBoMe,
        });
      }
    }
    danhSachGop.sort((a, b) => (b.batDauLuc || 0) - (a.batDauLuc || 0));
    return res.json({ cuocGoi: danhSachGop.slice(0, 30) });
  }));

  router.post('/gia-dinh/:chuTaiKhoanId/cuoc-goi/:id/danh-dau', chanDoc, asyncThuKy(async (req, res) => {
    const taiKhoanId = await KP.docPhien(req.headers.authorization);
    if (!taiKhoanId) return res.status(401).json({ maLoi: 'CHUA_DANG_NHAP' });
    const { chuTaiKhoanId, id } = req.params;
    const dsCon = await KP.danhSachDaGhep(chuTaiKhoanId);
    if (!dsCon.includes(taiKhoanId)) {
      return res.status(404).json({ maLoi: 'KHONG_TIM_THAY_CUOC_GOI' });
    }
    const kho = await KP.khoChung();
    const store = quanLyThuKy.layStore(`tk:${chuTaiKhoanId}`);
    await store.taiTuKho(kho);
    const hsCon = TK ? await TK.layHoSo(kho, taiKhoanId).catch(() => null) : null;
    store.nhanKiemTra(id, hsCon?.ten || 'Người thân');
    const kq = store.danhDauCuocGoi(id, req.body?.ketQua);
    if (!kq) return res.status(400).json({ maLoi: 'DANH_DAU_KHONG_HOP_LE' });
    return res.json({ phien: kq });
  }));

  // Chỉ trả danh mục mã và mô tả minh bạch, KHÔNG phơi trọng số chấm điểm nội bộ
  router.get('/bo-luat', chanDoc, (req, res) => {
    res.json({
      phienBan: PHIEN_BAN_LUAT_THU_KY,
      quyTacAnToan: BO_QUY_TAC_AN_TOAN,
      luatTinHieu: BO_LUAT_TIN_HIEU.map((l) => ({
        ma: l.ma,
        nhom: l.nhom,
        tinHieuChuan: l.tinHieuChuan || [],
        moTa: l.moTa,
      })),
      congHuong: CONG_HUONG_THU_KY.map((c) => ({
        ma: c.ma,
        hoKichBan: c.hoKichBan,
        giaiThich: c.giaiThich,
      })),
    });
  });

  router.get('/kich-ban', chanDoc, (req, res) => {
    res.json({ kichBan: BO_KICH_BAN_THU_KY });
  });

  router.post('/danh-gia', chanDoc, (req, res) => {
    res.json(chayDanhGiaBoLuatThuKy());
  });

  return router;
}

module.exports = { taoRouterThuKy };
