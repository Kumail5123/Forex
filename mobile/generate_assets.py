from PIL import Image, ImageDraw, ImageFont

# Design tokens matching mobile/src/theme/theme.js
BACKGROUND = (11, 17, 32)      # #0B1120
SURFACE = (27, 39, 64)         # #1B2740
ACCENT = (62, 123, 250)        # #3E7BFA
GAIN = (47, 191, 113)          # #2FBF71
TEXT = (245, 247, 250)         # #F5F7FA


def rounded_rect(draw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def draw_candlestick_mark(draw, cx, cy, scale):
    """A simple abstract candlestick chart mark — the app's signature glyph."""
    bar_w = int(18 * scale)
    gap = int(14 * scale)

    bars = [
        # (height, color, wick_extra_top, wick_extra_bottom)
        (60, GAIN, 14, 10),
        (90, ACCENT, 10, 16),
        (45, GAIN, 12, 8),
    ]
    total_w = len(bars) * bar_w + (len(bars) - 1) * gap
    start_x = cx - total_w // 2

    for i, (h, color, wick_top, wick_bottom) in enumerate(bars):
        h = int(h * scale)
        wick_top = int(wick_top * scale)
        wick_bottom = int(wick_bottom * scale)
        x0 = start_x + i * (bar_w + gap)
        x1 = x0 + bar_w
        y0 = cy - h // 2
        y1 = cy + h // 2

        # wick
        wick_x = (x0 + x1) // 2
        draw.line([(wick_x, y0 - wick_top), (wick_x, y1 + wick_bottom)], fill=color, width=max(2, int(3 * scale)))
        # body
        rounded_rect(draw, [x0, y0, x1, y1], radius=int(4 * scale), fill=color)


def make_icon(size, path):
    img = Image.new('RGB', (size, size), BACKGROUND)
    draw = ImageDraw.Draw(img)
    # subtle rounded surface panel behind the mark for depth
    pad = int(size * 0.10)
    rounded_rect(draw, [pad, pad, size - pad, size - pad], radius=int(size * 0.18), fill=SURFACE)
    draw_candlestick_mark(draw, size // 2, size // 2, scale=size / 220)
    img.save(path)


def make_splash(width, height, path):
    img = Image.new('RGB', (width, height), BACKGROUND)
    draw = ImageDraw.Draw(img)
    cx, cy = width // 2, height // 2 - int(height * 0.04)
    draw_candlestick_mark(draw, cx, cy, scale=min(width, height) / 420)

    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', int(height * 0.045))
    except Exception:
        font = ImageFont.load_default()

    text = 'FOREX APP'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw / 2, cy + int(height * 0.09)), text, fill=TEXT, font=font)
    img.save(path)


make_icon(1024, 'assets/icon.png')
make_icon(1024, 'assets/adaptive-icon.png')
make_splash(1284, 2778, 'assets/splash.png')
make_icon(48, 'assets/favicon.png')
print('Assets generated.')
