import math
from PIL import Image, ImageDraw, ImageFilter

def draw_single_sword(draw, center_x, center_y, scale, angle_deg):
    """
    Draw a single heroic sword rotated around (center_x, center_y).
    """
    rad = math.radians(angle_deg)
    cos_a = math.cos(rad)
    sin_a = math.sin(rad)
    
    def transform(x, y):
        # Translate relative to (center_x, center_y)
        dx = (x - 50) * scale
        dy = (y - 50) * scale
        rx = dx * cos_a - dy * sin_a + center_x
        ry = dx * sin_a + dy * cos_a + center_y
        return (rx, ry)

    # 1. Blade Left Side (Lighter steel #e2e8f0)
    blade_left = [transform(50, 6), transform(46.5, 14), transform(47.2, 58), transform(50, 58)]
    draw.polygon(blade_left, fill=(241, 245, 249, 255), outline=(203, 213, 225, 255))

    # 2. Blade Right Side (Darker steel #64748b)
    blade_right = [transform(50, 6), transform(53.5, 14), transform(52.8, 58), transform(50, 58)]
    draw.polygon(blade_right, fill=(100, 116, 139, 255), outline=(71, 85, 105, 255))

    # 3. Fuller (Blood groove)
    f_p1 = transform(50, 16)
    f_p2 = transform(50, 54)
    draw.line([f_p1, f_p2], fill=(30, 41, 59, 255), width=max(2, int(scale * 1.2)))

    # 4. Crossguard Wings (Gold #f59e0b)
    guard_left = [transform(50, 58), transform(43, 56), transform(34, 52), transform(33, 55), transform(40, 61), transform(50, 61)]
    guard_right = [transform(50, 58), transform(57, 56), transform(66, 52), transform(67, 55), transform(60, 61), transform(50, 61)]
    draw.polygon(guard_left, fill=(245, 158, 11, 255), outline=(180, 83, 9, 255))
    draw.polygon(guard_right, fill=(217, 119, 6, 255), outline=(180, 83, 9, 255))

    # Guard Finials
    p_gl = transform(33.5, 53.5)
    r_fin = scale * 2.2
    draw.ellipse([p_gl[0]-r_fin, p_gl[1]-r_fin, p_gl[0]+r_fin, p_gl[1]+r_fin], fill=(251, 191, 36, 255), outline=(180, 83, 9, 255))
    p_gr = transform(66.5, 53.5)
    draw.ellipse([p_gr[0]-r_fin, p_gr[1]-r_fin, p_gr[0]+r_fin, p_gr[1]+r_fin], fill=(251, 191, 36, 255), outline=(180, 83, 9, 255))

    # 5. Grip (Leather Wrapped #78350f)
    grip = [transform(47.8, 61), transform(52.2, 61), transform(52.2, 83), transform(47.8, 83)]
    draw.polygon(grip, fill=(90, 35, 10, 255), outline=(45, 15, 5, 255))

    # Wire wrap bands
    for gy in [65, 69, 73, 77, 81]:
        w1 = transform(47.8, gy)
        w2 = transform(52.2, gy + 1.2)
        draw.line([w1, w2], fill=(251, 191, 36, 255), width=max(1, int(scale * 0.9)))

    # 6. Central Guard Diamond & Ruby
    center_hub = [transform(50, 56), transform(54.5, 60), transform(50, 64), transform(45.5, 60)]
    draw.polygon(center_hub, fill=(251, 191, 36, 255), outline=(146, 64, 14, 255))
    c_hub = transform(50, 60)
    r_gem = scale * 1.8
    draw.ellipse([c_hub[0]-r_gem, c_hub[1]-r_gem, c_hub[0]+r_gem, c_hub[1]+r_gem], fill=(225, 29, 72, 255), outline=(159, 18, 57, 255))

    # 7. Pommel (Gold Wheel & Ruby Center)
    c_pom = transform(50, 87)
    r_pom = scale * 4.2
    draw.ellipse([c_pom[0]-r_pom, c_pom[1]-r_pom, c_pom[0]+r_pom, c_pom[1]+r_pom], fill=(245, 158, 11, 255), outline=(146, 64, 14, 255))
    r_pgem = scale * 2.0
    draw.ellipse([c_pom[0]-r_pgem, c_pom[1]-r_pgem, c_pom[0]+r_pgem, c_pom[1]+r_pgem], fill=(225, 29, 72, 255))
    
    # Pommel Spike
    p_spike = [transform(48.5, 91.2), transform(51.5, 91.2), transform(50, 94.5)]
    draw.polygon(p_spike, fill=(217, 119, 6, 255))


def create_master_icon(size=1024):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center = size / 2.0
    scale = size / 100.0

    # Draw ambient dark glow
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([size * 0.1, size * 0.1, size * 0.9, size * 0.9], fill=(245, 158, 11, 45))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size * 0.08))
    img.paste(glow, (0, 0), glow)

    # Draw Sword 1 (tilted -45 deg)
    draw_single_sword(draw, center, center, scale, -45)

    # Draw Sword 2 (tilted +45 deg)
    draw_single_sword(draw, center, center, scale, 45)

    # Center Clash Spark (White/Gold 8-point star)
    spark_p = [
        (center, center - scale * 7.5),
        (center + scale * 2.0, center - scale * 2.0),
        (center + scale * 7.5, center),
        (center + scale * 2.0, center + scale * 2.0),
        (center, center + scale * 7.5),
        (center - scale * 2.0, center + scale * 2.0),
        (center - scale * 7.5, center),
        (center - scale * 2.0, center - scale * 2.0)
    ]
    draw.polygon(spark_p, fill=(254, 240, 138, 240))
    draw.ellipse([center - scale * 2.5, center - scale * 2.5, center + scale * 2.5, center + scale * 2.5], fill=(255, 255, 255, 255))

    return img


if __name__ == '__main__':
    print("Generating high-resolution raster favicons from master geometry...")
    master = create_master_icon(1024)

    # 1. 512x512 PNG for high-DPI PWA / WebApp
    p512 = master.resize((512, 512), Image.Resampling.LANCZOS)
    p512.save("frontend/public/favicon-512x512.png", format="PNG")
    print("  -> Saved frontend/public/favicon-512x512.png")

    # 2. 192x192 PNG for standard PWA
    p192 = master.resize((192, 192), Image.Resampling.LANCZOS)
    p192.save("frontend/public/favicon-192x192.png", format="PNG")
    print("  -> Saved frontend/public/favicon-192x192.png")

    # 3. 180x180 PNG for Apple Touch Icon
    p180 = master.resize((180, 180), Image.Resampling.LANCZOS)
    p180.save("frontend/public/apple-touch-icon.png", format="PNG")
    print("  -> Saved frontend/public/apple-touch-icon.png")

    # 4. 32x32 & 16x16 PNGs
    p32 = master.resize((32, 32), Image.Resampling.LANCZOS)
    p32.save("frontend/public/favicon-32x32.png", format="PNG")
    p16 = master.resize((16, 16), Image.Resampling.LANCZOS)
    p16.save("frontend/public/favicon-16x16.png", format="PNG")
    print("  -> Saved favicon-32x32.png and favicon-16x16.png")

    # 5. Multi-resolution favicon.ico (16, 32, 48, 64)
    p48 = master.resize((48, 48), Image.Resampling.LANCZOS)
    p64 = master.resize((64, 64), Image.Resampling.LANCZOS)
    master.save(
        "frontend/public/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    print("  -> Saved frontend/public/favicon.ico (multi-res 16, 32, 48, 64)")

    # Also save as asset icon
    p512.save("frontend/public/assets/icons/crossed-swords.png", format="PNG")
    print("  -> Saved frontend/public/assets/icons/crossed-swords.png")
