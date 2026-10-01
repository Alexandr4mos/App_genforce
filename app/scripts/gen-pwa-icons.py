"""Gera ícones PWA a partir do ícone quadrado Genforce (g + raio)."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets-login" / "genforce-app-icon-source.jpg"
OUT = ROOT / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

# Fundo da marca (maskable / letterbox)
BRAND_BG = (0x0B, 0x0D, 0x12)


def load_source() -> Image.Image:
    im = Image.open(SOURCE).convert("RGB")
    # Garante quadrado (corta centro se necessário).
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return im.crop((left, top, left + side, top + side))


def resize_cover(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), Image.Resampling.LANCZOS)


def resize_maskable(im: Image.Image, size: int, safe_ratio: float = 0.6) -> Image.Image:
    """
    Canvas 100% #0B0D12; G nos 60% centrais (safe zone maskable Android).
    """
    content = int(size * safe_ratio)
    resized = im.resize((content, content), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (size, size), BRAND_BG)
    offset = (size - content) // 2
    canvas.paste(resized, (offset, offset))
    return canvas


def main():
    src = load_source()

    resize_cover(src, 192).save(OUT / "icon-192.png", "PNG", optimize=True)
    resize_cover(src, 512).save(OUT / "icon-512.png", "PNG", optimize=True)
    resize_maskable(src, 192).save(OUT / "icon-maskable-192.png", "PNG", optimize=True)
    resize_maskable(src, 512).save(OUT / "icon-maskable-512.png", "PNG", optimize=True)
    # iOS: fundo sólido, sem alpha
    resize_cover(src, 180).save(OUT / "apple-touch-icon.png", "PNG", optimize=True)
    resize_cover(src, 32).save(OUT / "favicon-32.png", "PNG", optimize=True)
    print("OK", OUT)


if __name__ == "__main__":
    main()
