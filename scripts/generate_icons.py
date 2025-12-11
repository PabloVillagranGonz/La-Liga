"""
Generador simple de iconos (PNG, favicon.ico) a partir de images/logo.JPG.
Requiere Pillow: pip install pillow

Uso:
  python3 scripts/generate_icons.py

Genera:
  images/favicon-16.png
  images/favicon-32.png
  images/android-chrome-192.png
  images/android-chrome-512.png
  images/apple-touch-icon.png (180x180)
  images/favicon.ico (multi-size)

No modifica index.html ni site.webmanifest automáticamente; ya están preparados para usar estos archivos.
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / 'images' / 'logo.JPG'
OUT = ROOT / 'images'

SIZES = {
    'favicon-16.png': (16,16),
    'favicon-32.png': (32,32),
    'android-chrome-192.png': (192,192),
    'android-chrome-512.png': (512,512),
    'apple-touch-icon.png': (180,180),
}

ICO_SIZES = [(16,16),(32,32),(48,48),(64,64)]

if not IMG.exists():
    print(f"No encontré {IMG}. Pon `logo.JPG` en `images/` o ajusta la ruta.")
    raise SystemExit(1)

img = Image.open(IMG).convert('RGBA')

for name, size in SIZES.items():
    outp = OUT / name
    resized = img.copy()
    resized.thumbnail(size, Image.LANCZOS)
    # Create a square canvas with transparent background and center the thumbnail
    canvas = Image.new('RGBA', size, (255,255,255,0))
    x = (size[0] - resized.width)//2
    y = (size[1] - resized.height)//2
    canvas.paste(resized, (x,y), resized)
    canvas.save(outp, format='PNG')
    print(f'Generado: {outp}')

# Generar favicon.ico
icons = []
for s in ICO_SIZES:
    tmp = img.copy()
    tmp.thumbnail(s, Image.LANCZOS)
    canvas = Image.new('RGBA', s, (255,255,255,0))
    x = (s[0] - tmp.width)//2
    y = (s[1] - tmp.height)//2
    canvas.paste(tmp, (x,y), tmp)
    icons.append(canvas)

ico_path = OUT / 'favicon.ico'
icons[0].save(ico_path, format='ICO', sizes=ICO_SIZES)
print(f'Generado: {ico_path}')
