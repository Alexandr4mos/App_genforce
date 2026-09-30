"""Gera ícones PWA a partir do logo Genforce."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "assets-login" / "genforce-logo-transparente.png"
OUT = ROOT / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

BRAND = (0, 51, 153, 255)  # #003399
WHITE = (255, 255, 255, 255)
BLACK = (0, 0, 0, 255)


def fit_logo(logo: Image.Image, box: int, pad_ratio: float = 0.12) -> Image.Image:
    """Encaixa o logo (largo) no quadrado com padding."""
    max_w = int(box * (1 - 2 * pad_ratio))
    max_h = int(box * (1 - 2 * pad_ratio))
    ratio = min(max_w / logo.width, max_h / logo.height)
    nw, nh = max(1, int(logo.width * ratio)), max(1, int(logo.height * ratio))
    resized = logo.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (box, box), (0, 0, 0, 0))
    canvas.paste(resized, ((box - nw) // 2, (box - nh) // 2), resized)
    return canvas


def make_square(size: int, bg, pad_ratio: float = 0.12) -> Image.Image:
    logo = Image.open(LOGO).convert("RGBA")
    # Remove quase-preto do fundo do PNG para poder colocar sobre bg sólido
    datas = logo.getdata()
    novos = []
    for r, g, b, a in datas:
        if a < 20 or (r < 35 and g < 35 and b < 35):
            novos.append((0, 0, 0, 0))
        else:
            novos.append((r, g, b, a))
    logo.putdata(novos)

    base = Image.new("RGBA", (size, size), bg)
    overlay = fit_logo(logo, size, pad_ratio=pad_ratio)
    return Image.alpha_composite(base, overlay)


def make_maskable(size: int) -> Image.Image:
    logo = Image.open(LOGO).convert("RGBA")
    datas = logo.getdata()
    novos = []
    for r, g, b, a in datas:
        if a < 20 or (r < 35 and g < 35 and b < 35):
            novos.append((0, 0, 0, 0))
        else:
            # Texto branco sobre fundo da marca (contraste no Android)
            novos.append((255, 255, 255, a))
    logo.putdata(novos)

    base = Image.new("RGBA", (size, size), BRAND)
    overlay = fit_logo(logo, size, pad_ratio=0.22)
    return Image.alpha_composite(base, overlay)


def main():
    make_square(192, WHITE, 0.14).convert("RGB").save(OUT / "icon-192.png", "PNG", optimize=True)
    make_square(512, WHITE, 0.14).convert("RGB").save(OUT / "icon-512.png", "PNG", optimize=True)
    make_maskable(192).convert("RGB").save(OUT / "icon-maskable-192.png", "PNG", optimize=True)
    make_maskable(512).convert("RGB").save(OUT / "icon-maskable-512.png", "PNG", optimize=True)
    make_square(180, WHITE, 0.14).convert("RGB").save(OUT / "apple-touch-icon.png", "PNG", optimize=True)
    # Favicon 32
    make_square(32, WHITE, 0.1).convert("RGB").save(OUT / "favicon-32.png", "PNG", optimize=True)
    print("OK", OUT)


if __name__ == "__main__":
    main()
