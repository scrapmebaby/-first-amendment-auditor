"""Build the static site and the self-contained, offline game."""
from pathlib import Path
import base64
import re
import shutil
import subprocess

ROOT = Path(__file__).parent
DIST = ROOT / "dist"
ESBUILD = ROOT / "node_modules/.bin/esbuild"


def minify_css(source):
    return subprocess.run(
        [str(ESBUILD), "--loader=css", "--minify", "--legal-comments=inline"],
        input=source, text=True, capture_output=True, check=True,
    ).stdout.strip()


for name in ("LICENSE", "EULA.txt"):
    shutil.copyfile(ROOT / name, DIST / name)
shutil.copytree(ROOT / "licenses", DIST / "licenses", dirs_exist_ok=True)

styles = (DIST / "style.css").read_text()
(DIST / "style.min.css").write_text(minify_css(styles))
styles = re.sub(r"@import url\(.*?\);", "", styles)
fonts = (DIST / "fonts.css").read_text()
fonts = re.sub(
    r"url\(([^)]+)\)",
    lambda match: "url(data:font/ttf;base64,"
    + base64.b64encode((DIST / match.group(1)).read_bytes()).decode()
    + ")",
    fonts,
)
inline_styles = minify_css(fonts + "\n" + styles)

# No source maps or local paths in the public bundle. Keep dependency notices.
subprocess.run(
    [str(ESBUILD), str(DIST / "app.js"), "--bundle", "--format=esm",
     "--minify", "--legal-comments=inline", "--outfile=" + str(DIST / "game.bundle.js")],
    check=True,
)
javascript = (DIST / "game.bundle.js").read_text().replace("</script", "<\\/script")
startup_error = """})().catch(error=>{console.error(error);
 document.getElementById('engine').textContent='STARTUP ERROR';
 document.getElementById('toast').textContent='The game could not start. Try a current Chrome or Edge browser.';
 document.getElementById('toast').classList.add('visible');});"""
html = (DIST / "index.html").read_text()
html = html.replace('<link rel="stylesheet" href="style.min.css">', '<style>' + inline_styles + '</style>')
html = html.replace(
    '<script type="module" src="game.bundle.js"></script>',
    '<script>\n(async()=>{\n' + javascript + '\n' + startup_error + '\n</script>',
)
notices = "\n".join(
    path.read_text() for path in [ROOT / "LICENSE", ROOT / "EULA.txt", *sorted((ROOT / "licenses").glob("*.txt"))]
)
html = html.replace('</head>', '<!-- Distribution terms and third-party notices:\n'
                    + notices.replace('--', '—') + '\n--></head>')
(ROOT / "1st-amendment-auditor.html").write_text(html)
print(f"Built standalone HTML: {len(html.encode()):,} bytes")
