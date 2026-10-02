from pathlib import Path
import base64
import re

root = Path(r"c:\Users\alexa\Documents\app-geradores\app")
icon = (root / "public" / "icons" / "icon-192.png").read_bytes()
uri = "data:image/png;base64," + base64.b64encode(icon).decode("ascii")
html_path = root / "public" / "index.html"
html = html_path.read_text(encoding="utf-8")
new_boot = (
    '    <div id="splash-boot" aria-hidden="true">\n'
    f'      <img src="{uri}" alt="" width="192" height="192" />\n'
    "    </div>"
)
html2, n = re.subn(
    r'<div id="splash-boot"[\s\S]*?</div>',
    new_boot,
    html,
    count=1,
)
if n != 1:
    raise SystemExit(f"splash-boot replace failed: n={n}")
html_path.write_text(html2, encoding="utf-8")
tmp = root / "public" / "icons" / "_icon192.datauri.txt"
if tmp.exists():
    tmp.unlink()
print("ok", len(uri), "chars in data uri")
