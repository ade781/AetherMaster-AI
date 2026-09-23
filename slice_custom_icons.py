import os
from PIL import Image

def slice_grid(image_path, output_dir, file_names):
    if not os.path.exists(image_path):
        print(f"[ERROR] {image_path} does not exist")
        return
    
    os.makedirs(output_dir, exist_ok=True)
    img = Image.open(image_path)
    w, h = img.size
    cell_w = w // 3
    cell_h = h // 3
    
    print(f"[*] Processing {image_path} ({w}x{h}) into {output_dir}")
    
    idx = 0
    for row in range(3):
        for col in range(3):
            left = col * cell_w
            top = row * cell_h
            right = left + cell_w
            bottom = top + cell_h
            
            cropped = img.crop((left, top, right, bottom))
            filename = file_names[idx]
            dest = os.path.join(output_dir, filename)
            cropped.save(dest, format="PNG")
            print(f"  -> Saved {dest}")
            idx += 1

# Grid 1: Campaign & General Icons
grid1_path = r"C:\Users\ad\.gemini\antigravity-ide\brain\61c4d31c-bb58-4256-801e-5b861d1fda7d\grid_campaign_icons_1790143830843.jpg"
grid1_out = r"c:\Users\ad\OneDrive\Dokumen\ad\ISENG\AetherMaster AI\frontend\public\assets\icons"
grid1_names = [
    "icon_swords.png",
    "icon_skull.png",
    "icon_wave.png",
    "icon_tavern.png",
    "icon_shield.png",
    "icon_grimoire.png",
    "icon_compass.png",
    "icon_d20.png",
    "icon_portal.png"
]
slice_grid(grid1_path, grid1_out, grid1_names)

# Grid 2: Weapons & Relics
grid2_path = r"C:\Users\ad\.gemini\antigravity-ide\brain\61c4d31c-bb58-4256-801e-5b861d1fda7d\grid_weapons_relics_1790143855154.jpg"
grid2_out = r"c:\Users\ad\OneDrive\Dokumen\ad\ISENG\AetherMaster AI\frontend\public\assets\items"
grid2_names = [
    "item_rapier.png",
    "item_bone_dagger.png",
    "item_sea_trident.png",
    "item_golden_crown.png",
    "item_01_potion_heal.png",
    "item_02_potion_mana.png",
    "item_06_skeleton_key.png",
    "item_05_cursed_amulet.png",
    "item_treasure_map.png"
]
slice_grid(grid2_path, grid2_out, grid2_names)

# Grid 3: Spells & Abilities
grid3_path = r"C:\Users\ad\.gemini\antigravity-ide\brain\61c4d31c-bb58-4256-801e-5b861d1fda7d\grid_spells_skills_1790143954803.jpg"
grid3_out = r"c:\Users\ad\OneDrive\Dokumen\ad\ISENG\AetherMaster AI\frontend\public\assets\skills"
grid3_names = [
    "skill_01_fireball.png",
    "skill_02_heal.png",
    "skill_03_stealth.png",
    "skill_ice_shards.png",
    "skill_lightning.png",
    "skill_skull_curse.png",
    "skill_vortex.png",
    "skill_05_perception.png",
    "skill_06_strike.png"
]
slice_grid(grid3_path, grid3_out, grid3_names)

print("[SUCCESS] All 3 grids (27 custom icons) sliced successfully!")
