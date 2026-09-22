import os
import sys
from PIL import Image

# Preset penamaan file berdasarkan kategori dari PEROMBAKAN_TOTAL_AETHERMASTER.txt
PRESET_NAMES = {
    "heroes": [
        "char_hero_01_paladin",
        "char_hero_02_ranger",
        "char_hero_03_wizard",
        "char_hero_04_dwarf",
        "char_hero_05_rogue",
        "char_hero_06_cleric",
        "char_hero_07_warlock",
        "char_hero_08_dragonborn",
        "char_hero_09_bard",
    ],
    "npcs": [
        "char_npc_01_barkeep",
        "char_npc_02_informant",
        "char_npc_03_vampire",
        "char_npc_04_necromancer",
        "char_npc_05_dryad",
        "char_npc_06_goblin",
        "char_npc_07_guard",
        "char_npc_08_cultist",
        "char_npc_09_lich",
    ],
    "backgrounds": [
        "bg_01_tavern",
        "bg_02_cursed_woods",
        "bg_03_sunken_citadel",
        "bg_04_crimson_crypt",
        "bg_05_vampire_castle",
        "bg_06_alchemy_lab",
        "bg_07_smuggler_cave",
        "bg_08_arcane_library",
        "bg_09_dragon_crater",
    ],
    "items": [
        "item_01_potion_heal",
        "item_02_potion_mana",
        "item_03_grimoire",
        "item_04_silver_dagger",
        "item_05_cursed_amulet",
        "item_06_skeleton_key",
        "item_07_golden_compass",
        "item_08_dragon_shield",
        "item_09_gold_pouch",
    ],
    "skills": [
        "skill_01_fireball",
        "skill_02_heal",
        "skill_03_stealth",
        "skill_04_shield",
        "skill_05_perception",
        "skill_06_strike",
        "skill_07_portal",
        "skill_08_lockpick",
        "skill_09_intimidate",
    ],
    "monsters": [
        "monster_01_skeleton",
        "monster_02_spider",
        "monster_03_shadow_wolf",
        "monster_04_mimic",
        "monster_05_gargoyle",
        "monster_06_eldritch",
        "monster_07_hydra",
        "monster_08_hellhound",
        "monster_09_drake",
    ],
}

def slice_3x3(image_path, output_dir, preset=None):
    if not os.path.exists(image_path):
        print(f"[ERROR] File '{image_path}' tidak ditemukan.")
        return

    os.makedirs(output_dir, exist_ok=True)
    img = Image.open(image_path)
    width, height = img.size

    cell_w = width // 3
    cell_h = height // 3

    print(f"[*] Memproses gambar: {image_path} ({width}x{height})")
    print(f"[*] Ukuran per sel (3x3): {cell_w}x{cell_h} px")
    print(f"[*] Output directory: {output_dir}")

    names_list = PRESET_NAMES.get(preset, []) if preset else []

    count = 0
    for row in range(3):
        for col in range(3):
            left = col * cell_w
            top = row * cell_h
            right = left + cell_w
            bottom = top + cell_h

            cropped = img.crop((left, top, right, bottom))

            if count < len(names_list):
                filename = f"{names_list[count]}.png"
            else:
                filename = f"asset_{row + 1}_{col + 1}.png"

            dest_path = os.path.join(output_dir, filename)
            cropped.save(dest_path, format="PNG")
            print(f"  -> [{count + 1}/9] Berhasil dipotong: {dest_path}")
            count += 1

    print("\n[SUCCESS] Selesai! 9 aset berhasil dipotong dan disimpan.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Penggunaan:")
        print("  python slice_grid.py <file_gambar_grid> <folder_tujuan> [preset]")
        print("Preset yang tersedia:")
        print("  heroes, npcs, backgrounds, items, skills, monsters")
        print("Contoh:")
        print("  python slice_grid.py grid_heroes.png ./frontend/public/assets/heroes heroes")
    else:
        img_file = sys.argv[1]
        out_folder = sys.argv[2]
        preset_choice = sys.argv[3] if len(sys.argv) > 3 else None
        slice_3x3(img_file, out_folder, preset_choice)
