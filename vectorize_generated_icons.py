import cv2
import numpy as np
import os
import xml.etree.ElementTree as ET

image_path = r"C:\Users\ad\.gemini\antigravity-ide\brain\61c4d31c-bb58-4256-801e-5b861d1fda7d\generated_vector_icons_1790147223394.jpg"
out_svg_dir = r"c:\Users\ad\OneDrive\Dokumen\ad\ISENG\AetherMaster AI\frontend\public\assets\icons\svg"
out_png_dir = r"c:\Users\ad\OneDrive\Dokumen\ad\ISENG\AetherMaster AI\frontend\public\assets\icons"

os.makedirs(out_svg_dir, exist_ok=True)
os.makedirs(out_png_dir, exist_ok=True)

img = cv2.imread(image_path)
h, w = img.shape[:2]
print(f"Loaded image size: {w}x{h}")

icon_names = [
    ["swords", "skull", "wave"],
    ["tavern", "shield", "compass"],
    ["grimoire", "portal", "crown"]
]

cell_w = w // 3
cell_h = h // 3

# Margin padding to avoid grid borders
pad_x = int(cell_w * 0.05)
pad_y = int(cell_h * 0.05)

def contour_to_svg_path(contours, hierarchy, target_size=64, src_w=cell_w, src_h=cell_h):
    path_data = []
    scale_x = target_size / src_w
    scale_y = target_size / src_h
    
    for cnt in contours:
        # Simplify contour slightly for clean SVG lines
        epsilon = 0.0015 * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        if len(approx) < 3:
            continue
        
        pts = approx.reshape(-1, 2)
        start_x = round(pts[0][0] * scale_x, 2)
        start_y = round(pts[0][1] * scale_y, 2)
        d = [f"M {start_x} {start_y}"]
        for pt in pts[1:]:
            x = round(pt[0] * scale_x, 2)
            y = round(pt[1] * scale_y, 2)
            d.append(f"L {x} {y}")
        d.append("Z")
        path_data.append(" ".join(d))
        
    return " ".join(path_data)

for r in range(3):
    for c in range(3):
        name = icon_names[r][c]
        x1 = c * cell_w + pad_x
        y1 = r * cell_h + pad_y
        x2 = (c + 1) * cell_w - pad_x
        y2 = (r + 1) * cell_h - pad_y
        
        crop = img[y1:y2, x1:x2]
        crop_h, crop_w = crop.shape[:2]
        
        # Convert to grayscale
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        
        # Binary threshold: black icon pixels become 255 (foreground)
        _, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)
        
        # Remove small speckles
        kernel = np.ones((2, 2), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        
        # Save transparent PNG as well
        b, g, r_ch = cv2.split(crop)
        alpha = thresh.copy()
        # Clean background pixels to pure black icon with alpha
        icon_rgba = np.zeros((crop_h, crop_w, 4), dtype=np.uint8)
        icon_rgba[:, :, 0] = 234  # Gold/Slate tint or clean dark
        icon_rgba[:, :, 1] = 179
        icon_rgba[:, :, 2] = 8
        icon_rgba[:, :, 3] = alpha
        
        png_path = os.path.join(out_png_dir, f"gen_icon_{name}.png")
        # Save high quality transparent PNG
        cv2.imwrite(png_path, cv2.cvtColor(crop, cv2.COLOR_BGR2BGRA))
        
        # Find contours with tree hierarchy for inner holes
        contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)
        
        # Filter tiny noise contours
        filtered_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > 25]
        
        path_str = contour_to_svg_path(filtered_contours, hierarchy, target_size=64, src_w=crop_w, src_h=crop_h)
        
        svg_content = f'''<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold_{name}" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fef08a" />
      <stop offset="0.5" stop-color="#eab308" />
      <stop offset="1" stop-color="#854d0e" />
    </linearGradient>
    <filter id="glow_{name}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>
  <path 
    d="{path_str}" 
    fill="url(#gold_{name})" 
    fill-rule="evenodd" 
    filter="url(#glow_{name})"
  />
</svg>'''
        
        svg_file = os.path.join(out_svg_dir, f"{name}.svg")
        with open(svg_file, "w", encoding="utf-8") as f:
            f.write(svg_content.strip())
            
        print(f"Vectorized & saved: {name}.svg (contours: {len(filtered_contours)})")

print("All 9 generated icons successfully converted to SVG vectors!")
