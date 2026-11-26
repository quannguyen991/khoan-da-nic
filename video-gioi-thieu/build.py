# Dựng lại design-board.html (một tệp, ảnh nhúng sẵn) từ board.src.html
import re, base64, mimetypes, os
s = open("board.src.html", encoding="utf-8").read()
def data(path):
    mt = mimetypes.guess_type(path)[0] or "application/octet-stream"
    return f"data:{mt};base64," + base64.b64encode(open(path, "rb").read()).decode()
def rep(m):
    return m.group(1) + data(m.group(2)) + m.group(3) if os.path.exists(m.group(2)) else m.group(0)
s = re.sub(r'(src=")((?:screens|assets|flow)/[^"]+)(")', rep, s)
s = re.sub(r'(url\()((?:screens|assets|flow)/[^)]+)(\))', rep, s)
open("design-board.html", "w", encoding="utf-8").write(s)
