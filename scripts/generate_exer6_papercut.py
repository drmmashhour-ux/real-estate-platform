#!/usr/bin/env python3
"""Generate Exercise 6 papercut postcard as vector artwork.

Outputs:
- docs/designs/Exer_6_Codex.pdf
- docs/designs/Exer_6_Codex.ai (PDF content with .ai extension)
"""

from __future__ import annotations

import math
import shutil
from pathlib import Path

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import landscape
from reportlab.pdfgen import canvas

INCH = 72
PAGE_SIZE = landscape((5 * INCH, 7 * INCH))  # 7x5 postcard (landscape)
WIDTH, HEIGHT = PAGE_SIZE


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def lerp_color(c1: Color, c2: Color, t: float) -> Color:
    return Color(lerp(c1.red, c2.red, t), lerp(c1.green, c2.green, t), lerp(c1.blue, c2.blue, t))


def add_organic_cutout(path, cx: float, cy: float, rx: float, ry: float, wobble: float = 0.22):
    """Append a closed organic blob subpath to an existing path object."""
    points = []
    for i in range(12):
        a = (math.pi * 2.0 * i) / 12.0
        mod = 1 + wobble * math.sin(3 * a + 0.7) + (wobble * 0.45) * math.cos(5 * a + 1.1)
        points.append((cx + (rx * mod) * math.cos(a), cy + (ry * mod) * math.sin(a)))

    path.moveTo(*points[0])
    for x, y in points[1:]:
        path.lineTo(x, y)
    path.close()


def draw_papercut_layer(
    c: canvas.Canvas,
    x: float,
    y: float,
    w: float,
    h: float,
    cutout_offset: tuple[float, float],
    fill_color: Color,
):
    """Draw one papercut object: rounded rectangle with an organic cutout."""
    dx, dy = cutout_offset
    cutout_cx = x + w * 0.54 + dx
    cutout_cy = y + h * 0.52 + dy
    cutout_rx = w * 0.22
    cutout_ry = h * 0.27

    # Build compound shape by including the outer path and inner path.
    # We then use even-odd fill to punch a hole.
    compound = c.beginPath()
    compound.roundRect(x, y, w, h, 14)
    add_organic_cutout(compound, cutout_cx, cutout_cy, cutout_rx, cutout_ry, wobble=0.26)

    # Drop shadow
    c.saveState()
    c.setFillColor(Color(0, 0, 0, alpha=0.18))
    shadow = c.beginPath()
    shadow.roundRect(x + 4, y - 4, w, h, 14)
    add_organic_cutout(shadow, cutout_cx + 4, cutout_cy - 4, cutout_rx, cutout_ry, wobble=0.26)
    c.drawPath(shadow, fill=1, stroke=0, fillMode=0)
    c.restoreState()

    c.setFillColor(fill_color)
    c.drawPath(compound, fill=1, stroke=0, fillMode=0)


def draw_gradient_panel(c: canvas.Canvas, x: float, y: float, w: float, h: float):
    c.saveState()
    clip = c.beginPath()
    clip.rect(x, y, w, h)
    c.clipPath(clip, stroke=0, fill=0)

    top = HexColor("#f3e8ff")
    bottom = HexColor("#c7d2fe")
    steps = 120
    for i in range(steps):
        t = i / max(steps - 1, 1)
        color = lerp_color(top, bottom, t)
        c.setFillColor(color)
        yi = y + h * (1 - (i + 1) / steps)
        c.rect(x, yi, w, h / steps + 1, stroke=0, fill=1)
    c.restoreState()


def draw_text(c: canvas.Canvas, x: float, y: float):
    c.setFillColor(HexColor("#1f2937"))
    c.setFont("Helvetica-Bold", 22)
    c.drawString(x, y, "Papercut Art")

    c.setFillColor(HexColor("#374151"))
    c.setFont("Helvetica", 12)
    c.drawString(x, y - 24, "Exercise 6")
    c.drawString(x, y - 42, "Vector postcard design")
    c.drawString(x, y - 60, "Made for Adobe Illustrator")


def main():
    output_dir = Path("docs/designs")
    output_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = output_dir / "Exer_6_Codex.pdf"
    ai_path = output_dir / "Exer_6_Codex.ai"

    c = canvas.Canvas(str(pdf_path), pagesize=PAGE_SIZE)

    # Background
    c.setFillColor(HexColor("#f8fafc"))
    c.rect(0, 0, WIDTH, HEIGHT, stroke=0, fill=1)

    # Left clipping mask area for papercut composition
    left_x, left_y = 22, 18
    left_w, left_h = WIDTH * 0.52, HEIGHT - 36

    c.saveState()
    left_clip = c.beginPath()
    left_clip.rect(left_x, left_y, left_w, left_h)
    c.clipPath(left_clip, stroke=0, fill=0)

    layer_specs = [
        (left_x + 10, left_y + 16, left_w - 20, left_h - 20, (0, 0), HexColor("#93c5fd")),
        (left_x + 24, left_y + 30, left_w - 44, left_h - 44, (-8, 10), HexColor("#a5b4fc")),
        (left_x + 38, left_y + 44, left_w - 68, left_h - 68, (5, -6), HexColor("#c4b5fd")),
        (left_x + 52, left_y + 58, left_w - 92, left_h - 92, (-7, -4), HexColor("#ddd6fe")),
        (left_x + 66, left_y + 72, left_w - 116, left_h - 116, (4, 6), HexColor("#fae8ff")),
        (left_x + 80, left_y + 86, left_w - 140, left_h - 140, (-3, -3), HexColor("#ffffff")),
    ]

    for spec in layer_specs:
        draw_papercut_layer(c, *spec)

    c.restoreState()

    # Right panel with rectangle + gradient + text
    right_x = WIDTH * 0.58
    right_w = WIDTH * 0.36
    right_y = 24
    right_h = HEIGHT - 48

    c.setFillColor(HexColor("#e5e7eb"))
    c.roundRect(right_x, right_y, right_w, right_h, 14, stroke=0, fill=1)

    draw_gradient_panel(c, right_x + 8, right_y + 8, right_w - 16, right_h - 16)
    draw_text(c, right_x + 22, right_y + right_h - 74)

    c.showPage()
    c.save()

    # Illustrator can open PDF-based AI files.
    shutil.copyfile(pdf_path, ai_path)
    print(f"Created: {pdf_path}")
    print(f"Created: {ai_path}")


if __name__ == "__main__":
    main()
