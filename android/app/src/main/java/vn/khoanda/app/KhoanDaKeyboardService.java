package vn.khoanda.app;

import android.app.AlertDialog;
import android.content.Intent;
import android.inputmethodservice.InputMethodService;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Bàn phím tùy chọn của Khoan Đã. Không ghi phím, không lưu lịch sử, không gửi
 * nội dung ngầm. Bản nháp chỉ được đọc sau khi người dùng bấm nút kiểm tra và
 * xác nhận hộp thoại nói rõ nội dung sẽ được đưa vào luồng phân tích hiện có.
 */
public class KhoanDaKeyboardService extends InputMethodService {
    private boolean so = false;
    private boolean vietHoa = false;
    private boolean truongNhayCam = false;
    private LinearLayout cot;

    @Override
    public View onCreateInputView() {
        cot = new LinearLayout(this);
        cot.setOrientation(LinearLayout.VERTICAL);
        cot.setPadding(dp(5), dp(4), dp(5), dp(5));
        cot.setBackgroundColor(0xffeee9f7);
        veBanPhim();
        return cot;
    }

    @Override
    public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        truongNhayCam = laTruongMatKhau(info);
        if (cot != null) veBanPhim();
    }

    private boolean laTruongMatKhau(EditorInfo info) {
        if (info == null) return true;
        int inputClass = info.inputType & InputType.TYPE_MASK_CLASS;
        // Ô chỉ nhập số có thể là OTP/PIN; không đọc từ loại ô này.
        if (inputClass == InputType.TYPE_CLASS_NUMBER || inputClass == InputType.TYPE_CLASS_PHONE) return true;
        int variation = info.inputType & (InputType.TYPE_MASK_CLASS | InputType.TYPE_MASK_VARIATION);
        return variation == (InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD)
                || variation == (InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD)
                || variation == (InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD)
                || variation == (InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_VARIATION_PASSWORD);
    }

    private void veBanPhim() {
        if (cot == null) return;
        cot.removeAllViews();
        LinearLayout thanh = new LinearLayout(this);
        thanh.setGravity(Gravity.CENTER_VERTICAL);
        thanh.addView(nut(getString(R.string.keyboard_check), v -> kiemTraBanNhap()), new LinearLayout.LayoutParams(0, dp(46), 1.35f));
        thanh.addView(nut(getString(R.string.keyboard_reply), v -> chen(getString(R.string.keyboard_sample_reply))), new LinearLayout.LayoutParams(0, dp(46), 1f));
        thanh.addView(nut("⚙", v -> moCaiDat()), new LinearLayout.LayoutParams(dp(48), dp(46)));
        cot.addView(thanh);

        if (truongNhayCam) {
            TextView canhBao = new TextView(this);
            canhBao.setText(getString(R.string.keyboard_private_field));
            canhBao.setTextColor(0xff8b1e1e);
            canhBao.setTextSize(14);
            canhBao.setGravity(Gravity.CENTER);
            canhBao.setPadding(dp(4), dp(5), dp(4), dp(5));
            cot.addView(canhBao);
        }

        if (so) {
            hang("1234567890");
            hang("@#$%&*-+()");
            hang(".,!?/:");
        } else {
            hang("qwertyuiop");
            hang("asdfghjkl");
            hang("⇧zxcvbnm⌫");
        }

        LinearLayout cuoi = new LinearLayout(this);
        cuoi.addView(nut("?123", v -> { so = !so; veBanPhim(); }), new LinearLayout.LayoutParams(dp(56), dp(50)));
        cuoi.addView(nut("🌐", v -> ((InputMethodManager) getSystemService(INPUT_METHOD_SERVICE)).showInputMethodPicker()), new LinearLayout.LayoutParams(dp(52), dp(50)));
        cuoi.addView(nut("☺", v -> chen("😊")), new LinearLayout.LayoutParams(dp(48), dp(50)));
        cuoi.addView(nut(getString(R.string.keyboard_space), v -> chen(" "), true), new LinearLayout.LayoutParams(0, dp(50), 1f));
        cuoi.addView(nut("↵", v -> enter()), new LinearLayout.LayoutParams(dp(56), dp(50)));
        cot.addView(cuoi);
    }

    private void hang(String keys) {
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER);
        for (int i = 0; i < keys.length(); i++) {
            final String key = keys.substring(i, i + 1);
            Button b = nut(key, v -> bam(key));
            if ("aeiouyAEIOUYdD".contains(key)) b.setOnLongClickListener(v -> { hienDau(key); return true; });
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(49), 1f);
            lp.setMargins(dp(1), dp(2), dp(1), dp(2));
            row.addView(b, lp);
        }
        cot.addView(row);
    }

    private Button nut(String label, View.OnClickListener click) { return nut(label, click, false); }

    private Button nut(String label, View.OnClickListener click, boolean space) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextSize(space ? 15 : 17);
        b.setAllCaps(false);
        b.setMinHeight(dp(44));
        b.setPadding(dp(2), 0, dp(2), 0);
        b.setTextColor(0xff21164a);
        b.setBackgroundTintList(android.content.res.ColorStateList.valueOf(space ? 0xffffffff : 0xfffaf9fc));
        b.setOnClickListener(click);
        return b;
    }

    private void bam(String key) {
        if ("⇧".equals(key)) { vietHoa = !vietHoa; return; }
        if ("⌫".equals(key)) {
            InputConnection ic = getCurrentInputConnection();
            if (ic != null) ic.deleteSurroundingText(1, 0);
            return;
        }
        String value = vietHoa ? key.toUpperCase() : key;
        chen(value);
        if (vietHoa) vietHoa = false;
    }

    private void chen(String value) {
        InputConnection ic = getCurrentInputConnection();
        if (ic != null) ic.commitText(value, 1);
    }

    private void enter() {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        EditorInfo info = getCurrentInputEditorInfo();
        int action = info == null ? EditorInfo.IME_ACTION_NONE : info.imeOptions & EditorInfo.IME_MASK_ACTION;
        if (action != EditorInfo.IME_ACTION_NONE && action != EditorInfo.IME_ACTION_UNSPECIFIED) ic.performEditorAction(action);
        else ic.commitText("\n", 1);
    }

    private void hienDau(String key) {
        String[] choices;
        switch (key.toLowerCase()) {
            case "a": choices = new String[]{"á","à","ả","ã","ạ","â","ấ","ầ","ẩ","ẫ","ậ","ă","ắ","ằ","ẳ","ẵ","ặ"}; break;
            case "e": choices = new String[]{"é","è","ẻ","ẽ","ẹ","ê","ế","ề","ể","ễ","ệ"}; break;
            case "i": choices = new String[]{"í","ì","ỉ","ĩ","ị"}; break;
            case "o": choices = new String[]{"ó","ò","ỏ","õ","ọ","ô","ố","ồ","ổ","ỗ","ộ","ơ","ớ","ờ","ở","ỡ","ợ"}; break;
            case "u": choices = new String[]{"ú","ù","ủ","ũ","ụ","ư","ứ","ừ","ử","ữ","ự"}; break;
            case "y": choices = new String[]{"ý","ỳ","ỷ","ỹ","ỵ"}; break;
            case "d": choices = new String[]{"đ"}; break;
            default: return;
        }
        if (Character.isUpperCase(key.charAt(0))) for (int i = 0; i < choices.length; i++) choices[i] = choices[i].toUpperCase();
        new AlertDialog.Builder(this).setTitle(R.string.keyboard_diacritics).setItems(choices, (d, which) -> chen(choices[which])).show();
    }

    private void kiemTraBanNhap() {
        if (truongNhayCam || laTruongMatKhau(getCurrentInputEditorInfo())) {
            Toast.makeText(this, R.string.keyboard_private_field, Toast.LENGTH_LONG).show();
            return;
        }
        InputConnection ic = getCurrentInputConnection();
        CharSequence before = ic == null ? null : ic.getTextBeforeCursor(500, 0);
        String draft = before == null ? "" : before.toString().trim();
        if (draft.isEmpty()) {
            Toast.makeText(this, R.string.keyboard_no_draft, Toast.LENGTH_LONG).show();
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle(R.string.keyboard_confirm_title)
                .setMessage(getString(R.string.keyboard_confirm_body, draft))
                .setNegativeButton(R.string.keyboard_cancel, (d, w) -> d.dismiss())
                .setPositiveButton(R.string.keyboard_continue, (d, w) -> {
                    Intent share = new Intent(Intent.ACTION_SEND);
                    share.setType("text/plain");
                    share.putExtra(Intent.EXTRA_TEXT, draft);
                    share.setClassName(getPackageName(), "vn.khoanda.app.MainActivity");
                    share.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(share);
                }).show();
    }

    private void moCaiDat() {
        Intent i = new Intent(android.provider.Settings.ACTION_INPUT_METHOD_SETTINGS);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(i);
    }

    private int dp(int n) { return (int) (n * getResources().getDisplayMetrics().density + 0.5f); }
}
