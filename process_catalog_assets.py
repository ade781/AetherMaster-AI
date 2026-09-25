import os
import shutil
import numpy as np
from PIL import Image, ImageFilter, ImageOps

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, "frontend", "public", "assets")
BRAIN_DIR = r"C:\Users\ad\.gemini\antigravity-ide\brain\00792caa-6e46-4a15-9948-32912a483231"

ITEMS_GRID_PATH = os.path.join(BRAIN_DIR, "grid_items_part2_1790317186604.jpg")
SKILLS_GRID_PATH = os.path.join(BRAIN_DIR, "grid_skills_part2_1790317257305.jpg")
FRAME_PATH = os.path.join(BRAIN_DIR, "frame_character_gold_1790317274556.jpg")
PARCHMENT_PATH = os.path.join(BRAIN_DIR, "parchment_paper_bg_1790317292168.jpg")
D20_PATH = os.path.join(BRAIN_DIR, "d20_texture_diffuse_1790317323917.jpg")

# 1. Ensure target directories
covers_dir = os.path.join(ASSETS_DIR, "covers")
d3_dir = os.path.join(ASSETS_DIR, "3d")
items_dir = os.path.join(ASSETS_DIR, "items")
skills_dir = os.path.join(ASSETS_DIR, "skills")

os.makedirs(covers_dir, exist_ok=True)
os.makedirs(d3_dir, exist_ok=True)
os.makedirs(items_dir, exist_ok=True)
os.makedirs(skills_dir, exist_ok=True)

print("[1] Slicing Items 10-18 from 3x3 grid...")
img_items = Image.open(ITEMS_GRID_PATH)

item_names = [
    "item_10_elixir_vitality.png",
    "item_11_flame_sword.png",
    "item_12_teleport_scroll.png",
    "item_13_shadow_ring.png",
    "item_14_holy_water.png",
    "item_15_lockpick_set.png",
    "item_16_crown_kings.png",
    "item_17_dragon_horn.png",
    "item_18_meat_ration.png"
]

# Exact cell boxes detected from grid_items_part2
cell_coords = [
    (50, 50, 335, 335),     # R0C0
    (363, 50, 645, 335),    # R0C1
    (675, 50, 955, 335),    # R0C2
    (50, 360, 335, 645),    # R1C0
    (363, 360, 645, 645),   # R1C1
    (675, 360, 955, 645),   # R1C2
    (50, 670, 335, 955),    # R2C0
    (363, 670, 645, 955),   # R2C1
    (675, 670, 955, 955),   # R2C2
]

for idx, (name, box) in enumerate(zip(item_names, cell_coords)):
    cropped = img_items.crop(box)
    # Upscale smoothly to standard 512x512
    resized = cropped.resize((512, 512), Image.Resampling.LANCZOS)
    out_path = os.path.join(items_dir, name)
    resized.save(out_path, format="PNG")
    print(f"  -> Saved item: {name} (512x512)")

print("\n[2] Processing Skills 10-12...")
# Skill 10 is lightning
skill_10_src = os.path.join(skills_dir, "skill_lightning.png")
skill_10_dst = os.path.join(skills_dir, "skill_10_lightning.png")
if os.path.exists(skill_10_src):
    shutil.copyfile(skill_10_src, skill_10_dst)
    print("  -> Copied skill_10_lightning.png from skill_lightning.png")

# Skill 11 (Charm) & Skill 12 (Inspect) from grid_skills_part2
img_skills = Image.open(SKILLS_GRID_PATH)
w_s, h_s = img_skills.size
cell_ws = w_s // 3
cell_hs = h_s // 3

# Cell (0,0) is Charm Spell, Cell (0,1) is Inspect Skill
skill_11_crop = img_skills.crop((0, 0, cell_ws, cell_hs)).resize((256, 256), Image.Resampling.LANCZOS)
skill_11_crop.save(os.path.join(skills_dir, "skill_11_charm.png"), format="PNG")
print("  -> Saved skill_11_charm.png (256x256)")

skill_12_crop = img_skills.crop((cell_ws, 0, cell_ws * 2, cell_hs)).resize((256, 256), Image.Resampling.LANCZOS)
skill_12_crop.save(os.path.join(skills_dir, "skill_12_inspect.png"), format="PNG")
print("  -> Saved skill_12_inspect.png (256x256)")

print("\n[3] Setting up Pack 7 Covers & UI Chrome...")
# Copy covers
tavern_src = os.path.join(ASSETS_DIR, "bg_tavern.jpg")
crypt_src = os.path.join(ASSETS_DIR, "bg_crypt.jpg")
citadel_src = os.path.join(ASSETS_DIR, "bg_sunken_citadel.jpg")

if os.path.exists(tavern_src):
    shutil.copyfile(tavern_src, os.path.join(covers_dir, "cover_tavern.jpg"))
    print("  -> Created covers/cover_tavern.jpg")
if os.path.exists(crypt_src):
    shutil.copyfile(crypt_src, os.path.join(covers_dir, "cover_crypt.jpg"))
    print("  -> Created covers/cover_crypt.jpg")
if os.path.exists(citadel_src):
    shutil.copyfile(citadel_src, os.path.join(covers_dir, "cover_citadel.jpg"))
    print("  -> Created covers/cover_citadel.jpg")

# Parchment background
if os.path.exists(PARCHMENT_PATH):
    shutil.copyfile(PARCHMENT_PATH, os.path.join(covers_dir, "parchment_paper_bg.jpg"))
    print("  -> Created covers/parchment_paper_bg.jpg")

# Gold character frame with alpha transparency
if os.path.exists(FRAME_PATH):
    frame_img = Image.open(FRAME_PATH).convert("RGBA")
    f_arr = np.array(frame_img)
    # The inner area is around x: [270, 750], y: [270, 750]
    # In this inner square, black is background to be transparent
    h, w, _ = f_arr.shape
    center_y, center_x = h // 2, w // 2
    
    # Calculate mask where color is very dark near center or very dark at the outer edges
    r, g, b, a = f_arr[:, :, 0], f_arr[:, :, 1], f_arr[:, :, 2], f_arr[:, :, 3]
    brightness = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Center cutout: inside [265, 755] in both axes where brightness < 30
    inner_mask = np.zeros((h, w), dtype=bool)
    inner_mask[270:750, 270:750] = (brightness[270:750, 270:750] < 35)
    
    # Outer background cutout: near image borders where brightness < 30
    outer_mask = (brightness < 30) & ~((np.abs(np.arange(h)[:, None] - center_y) < 380) & (np.abs(np.arange(w)[None, :] - center_x) < 380))
    
    # Set alpha to 0 for cutout areas
    f_arr[inner_mask | outer_mask, 3] = 0
    
    clean_frame = Image.fromarray(f_arr)
    clean_frame.save(os.path.join(covers_dir, "frame_character_gold.png"), format="PNG")
    print("  -> Created covers/frame_character_gold.png (RGBA Transparent)")

print("\n[4] Generating Pack 8 3D D20 Textures (Diffuse, Normal, Roughness)...")
if os.path.exists(D20_PATH):
    d20_img = Image.open(D20_PATH).convert("RGB")
    d20_out_diffuse = os.path.join(d3_dir, "d20_diffuse.png")
    d20_img.save(d20_out_diffuse, format="PNG")
    print("  -> Saved 3d/d20_diffuse.png")

    # Generate Tangent-Space Normal Map (#8080FF base)
    # Convert diffuse to grayscale heightmap
    gray = np.array(d20_img.convert("L"), dtype=np.float32)
    # Sobel gradients
    sobel_x = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float32)
    sobel_y = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float32)

    from scipy.ndimage import convolve
    gx = convolve(gray, sobel_x) / 8.0
    gy = convolve(gray, sobel_y) / 8.0
    
    # Normal vector = (-gx * strength, -gy * strength, 1.0) normalized
    strength = 2.0
    nx = -gx * strength
    ny = -gy * strength
    nz = np.ones_like(gray) * 64.0
    
    length = np.sqrt(nx**2 + ny**2 + nz**2)
    nx /= length
    ny /= length
    nz /= length

    # Map [-1, 1] to [0, 255]
    norm_r = ((nx + 1.0) * 0.5 * 255.0).astype(np.uint8)
    norm_g = ((ny + 1.0) * 0.5 * 255.0).astype(np.uint8)
    norm_b = ((nz + 1.0) * 0.5 * 255.0).astype(np.uint8)

    normal_map = np.stack([norm_r, norm_g, norm_b], axis=-1)
    Image.fromarray(normal_map).save(os.path.join(d3_dir, "d20_normal.png"), format="PNG")
    print("  -> Generated 3d/d20_normal.png")

    # Generate Roughness Map:
    # Smooth resin = dark grey (~50), Engraved Gold and bevels = lighter (~140)
    roughness = np.clip(40 + (gray / 255.0) * 110, 0, 255).astype(np.uint8)
    Image.fromarray(roughness).save(os.path.join(d3_dir, "d20_roughness.png"), format="PNG")
    print("  -> Generated 3d/d20_roughness.png")

print("\n[SUCCESS] All missing catalog assets successfully generated and deployed!")
