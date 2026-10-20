"""Build the static Demo site. Keep all uploadable materials in this directory."""
from pathlib import Path
from urllib.parse import quote
import json
import shutil

root = Path(__file__).resolve().parent
out = root / 'dist'
media_types = {
    '.mp4': 'video', '.webm': 'video', '.mov': 'video',
    '.pptx': 'presentation', '.ppt': 'presentation',
    '.pdf': 'whitepaper', '.docx': 'whitepaper',
    '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.webp': 'image', '.gif': 'image',
}

def category(path):
    name = path.stem.casefold()
    if name.startswith(('presentation-', 'presentation_', 'slides-', 'slides_')):
        return 'presentation'
    if name.startswith(('whitepaper-', 'whitepaper_', 'rapport-', 'rapport_')):
        return 'whitepaper'
    return media_types[path.suffix.casefold()]

if out.exists():
    shutil.rmtree(out)
out.mkdir()
shutil.copy2(root / 'index.html', out / 'index.html')
items = []
for path in sorted(root.iterdir(), key=lambda p: p.name.casefold()):
    if not path.is_file() or path.suffix.casefold() not in media_types:
        continue
    kind = category(path)
    title = path.stem
    for prefix in ('presentation-', 'presentation_', 'slides-', 'slides_', 'whitepaper-', 'whitepaper_', 'rapport-', 'rapport_', 'video-', 'video_', 'bild-', 'bild_'):
        if title.casefold().startswith(prefix):
            title = title[len(prefix):]
            break
    title = title.replace('_', ' ').replace('-', ' ').strip().capitalize() or path.name
    items.append({'type': kind, 'title': title, 'file': path.name, 'format': path.suffix.lstrip('.').upper()})
    shutil.copy2(path, out / path.name)
(out / 'content-manifest.json').write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Built {out} with {len(items)} resource(s)')
