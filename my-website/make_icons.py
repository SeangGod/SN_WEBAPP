"""
Generate the site's icon files with PIL.

Draws the same mark as icon.svg at several sizes, supersampled 4x and
downsampled with LANCZOS so the edges are clean.

Outputs:
    favicon-16.png, favicon-32.png, favicon-48.png
    apple-touch-icon.png   (180x180, opaque, no transparency)
    icon-192.png, icon-512.png   (PWA / Android)
    favicon.ico            (16 + 32 + 48 multi-size)
"""

from PIL import Image, ImageDraw
import os

HERE = os.path.dirname(os.path.abspath(__file__))

BG_TOP = (21, 25, 34)
BG_BOT = (11, 13, 18)
LINE = (39, 45, 58)
ACCENT = (224, 164, 74)
ACCENT_2 = (111, 179, 255)
MID = (232, 185, 104)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient_color(t):
    """Match the SVG gradient: accent -> mid -> accent-2."""
    if t <= 0.55:
        return lerp(ACCENT, MID, t / 0.55)
    return lerp(MID, ACCENT_2, (t - 0.55) / 0.45)


def draw_icon(size, opaque=False, ss=4):
    """Render the mark at `size`, supersampled `ss` times."""
    S = size * ss
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # --- rounded tile with a vertical gradient ---
    tile = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    td = ImageDraw.Draw(tile)
    for y in range(S):
        td.line([(0, y), (S, y)], fill=lerp(BG_TOP, BG_BOT, y / max(S - 1, 1)) + (255,))

    radius = round(S * 14 / 64)
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=radius, fill=255)
    img.paste(tile, (0, 0), mask)

    # --- hairline border ---
    bw = max(1, round(S * 1.5 / 64))
    d.rounded_rectangle(
        [bw // 2, bw // 2, S - 1 - bw // 2, S - 1 - bw // 2],
        radius=radius, outline=LINE + (255,), width=bw,
    )

    # --- diamond ring, drawn as four gradient-shaded segments ---
    cx = cy = S / 2
    half = S * 21 / 64          # half-diagonal
    pts = [(cx, cy - half), (cx + half, cy), (cx, cy + half), (cx - half, cy)]
    lw = max(1, round(S * 5 / 64))

    # Each edge gets its own colour sampled from the gradient, then a small
    # blend at the joints keeps the corners from showing a seam.
    edges = [(0, 1), (1, 2), (2, 3), (3, 0)]
    for i, (a, b) in enumerate(edges):
        t = (i + 0.5) / len(edges)
        d.line([pts[a], pts[b]], fill=gradient_color(t) + (255,), width=lw,
               joint="curve")

    # Round the four vertices so the joins look like the SVG's stroke-linejoin.
    for i, (px, py) in enumerate(pts):
        t = i / len(edges)
        d.ellipse([px - lw / 2, py - lw / 2, px + lw / 2, py + lw / 2],
                  fill=gradient_color(t) + (255,))

    # --- centre node ---
    r = S * 4.6 / 64
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=gradient_color(0.35) + (255,))

    # --- downsample ---
    out = img.resize((size, size), Image.LANCZOS)

    if opaque:
        flat = Image.new("RGB", (size, size), BG_BOT)
        flat.paste(out, (0, 0), out)
        return flat
    return out


def main():
    written = []

    for s in (16, 32, 48):
        p = os.path.join(HERE, f"favicon-{s}.png")
        draw_icon(s).save(p)
        written.append((os.path.basename(p), s, os.path.getsize(p)))

    p = os.path.join(HERE, "apple-touch-icon.png")
    draw_icon(180, opaque=True).save(p)
    written.append(("apple-touch-icon.png", 180, os.path.getsize(p)))

    for s in (192, 512):
        p = os.path.join(HERE, f"icon-{s}.png")
        draw_icon(s).save(p)
        written.append((f"icon-{s}.png", s, os.path.getsize(p)))

    # Multi-size .ico
    p = os.path.join(HERE, "favicon.ico")
    base = draw_icon(256)
    base.save(p, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    written.append(("favicon.ico", "16+32+48", os.path.getsize(p)))

    print("=" * 58)
    print("ICON GENERATION")
    print("=" * 58)
    for name, size, nbytes in written:
        print(f"  {name:<24} {str(size):<10} {nbytes:>7,} bytes")
    print("-" * 58)
    print(f"  {len(written)} files written to {HERE}")


if __name__ == "__main__":
    main()
