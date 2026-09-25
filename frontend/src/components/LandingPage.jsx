import React, { useState } from 'react';
import { 
  BookOpen, 
  ChevronDown, 
  ExternalLink, 
  Menu, 
  X, 
  Scroll, 
  Sparkles, 
  Download, 
  Code, 
  Check, 
  Compass, 
  Terminal
} from 'lucide-react';
import audio from '../services/audioService';
import { 
  IconSwords, 
  IconSkull, 
  IconWave, 
  IconTavernMug, 
  IconShield, 
  IconCompass, 
  IconGrimoire, 
  IconPortal,
  IconCrown
} from './icons/FantasyIcons';

import HeroBanner from './landing/HeroBanner';
import CampaignGrid from './landing/CampaignGrid';
import FeaturesShowcase from './landing/FeaturesShowcase';
import PromptStudioModal from './landing/PromptStudioModal';

export default function LandingPage({
  campaigns = [],
  initLoading = false,
  onSelectCampaign,
  onOpenSaveLoad,
  showToast
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [iconModalTab, setIconModalTab] = useState('svg');
  const [copiedSvgId, setCopiedSvgId] = useState(null);

  const SVG_ICONS_COLLECTION = [
    { id: 'swords', name: 'Pedang Bersilang', component: IconSwords, file: '/assets/icons/svg/swords.svg', desc: 'Simbol inisiatif pertempuran & taktik D&D 5E' },
    { id: 'skull', name: 'Tengkorak Kutukan', component: IconSkull, file: '/assets/icons/svg/skull.svg', desc: 'Bahaya kematian, undead & dungeon gothic' },
    { id: 'wave', name: 'Ombak Abyssal', component: IconWave, file: '/assets/icons/svg/wave.svg', desc: 'Misteri samudra & reruntuhan kuil kuno' },
    { id: 'tavern', name: 'Cangkir Kedai Kayu', component: IconTavernMug, file: '/assets/icons/svg/tavern.svg', desc: 'Tempat istirahat panjang & interaksi NPC' },
    { id: 'shield', name: 'Perisai Kesatria', component: IconShield, file: '/assets/icons/svg/shield.svg', desc: 'Armor Class (AC) & ketahanan fisik' },
    { id: 'compass', name: 'Kompas Navigasi', component: IconCompass, file: '/assets/icons/svg/compass.svg', desc: 'Eksplorasi dunia & orientasi petualang' },
    { id: 'grimoire', name: 'Grimoire Mantra', component: IconGrimoire, file: '/assets/icons/svg/grimoire.svg', desc: 'Sihir arcana, spellbook & catatan Dungeon Master' },
    { id: 'portal', name: 'Gerbang Dimensi', component: IconPortal, file: '/assets/icons/svg/portal.svg', desc: 'Teleportasi & nodus percabangan alur' },
    { id: 'crown', name: 'Mahkota Kristal', component: IconCrown, file: '/assets/icons/svg/crown.svg', desc: 'Simbol hierarki, relik kekuasaan & artefak mistis' },
  ];

  const ALL_BACKGROUNDS_COLLECTION = [
    { id: 'bg_01_tavern', name: 'Kedai Oakhaven', genre: 'Dark Fantasy', file: '/assets/backgrounds/bg_01_tavern.png', desc: 'Kedai kayu hangat tempat berkumpulnya petualang' },
    { id: 'bg_02_cursed_woods', name: 'Hutan Terkutuk', genre: 'Gothic Horror', file: '/assets/backgrounds/bg_02_cursed_woods.png', desc: 'Pepohonan purba berkabut penuh bisikan misterius' },
    { id: 'bg_03_sunken_citadel', name: 'Kuil Samudra Bawah Air', genre: 'Eldritch', file: '/assets/backgrounds/bg_03_sunken_citadel.png', desc: 'Reruntuhan karang bercahaya bioluminesensi mistis' },
    { id: 'bg_04_crimson_crypt', name: 'Katakombe Berdarah', genre: 'Gothic Horror', file: '/assets/backgrounds/bg_04_crimson_crypt.png', desc: 'Makam batu kuno tempat bersemayamnya necromancer' },
    { id: 'bg_05_vampire_castle', name: 'Kastil Vampir', genre: 'Gothic Horror', file: '/assets/backgrounds/bg_05_vampire_castle.png', desc: 'Benteng megah bernuansa darah di puncak tebing' },
    { id: 'bg_06_alchemy_lab', name: 'Laboratorium Alkimia', genre: 'Arcane', file: '/assets/backgrounds/bg_06_alchemy_lab.png', desc: 'Ruang eksperimen ramuan dan manuskrip arkanum' },
    { id: 'bg_07_smuggler_cave', name: 'Gua Penyelundup', genre: 'Adventure', file: '/assets/backgrounds/bg_07_smuggler_cave.png', desc: 'Gua pesisir tersembunyi dengan tumpukan peti emas' },
    { id: 'bg_08_arcane_library', name: 'Perpustakaan Sihir', genre: 'Arcane', file: '/assets/backgrounds/bg_08_arcane_library.png', desc: 'Ribuan gulungan mantra kuno yang melayang di udara' },
    { id: 'bg_09_dragon_crater', name: 'Kawah Naga Purba', genre: 'High Fantasy', file: '/assets/backgrounds/bg_09_dragon_crater.png', desc: 'Kawah belerang bekas pertempuran wyrm purba' },
    { id: 'bg_10_ancient_ruins', name: 'Reruntuhan Monolit Elven', genre: 'Mythic', file: '/assets/backgrounds/bg_10_ancient_ruins.png', desc: 'Monolit batu berukir rune arkanum berpendar di senja berkabut' },
    { id: 'bg_11_throne_room', name: 'Aula Takhta Katedral Gotik', genre: 'Dark Fantasy', file: '/assets/backgrounds/bg_11_throne_room.png', desc: 'Singgasana obsidian megah dengan kaca mawar scarlet menyala' },
    { id: 'bg_12_underdark_cavern', name: 'Gua Underdark Bioluminesensi', genre: 'Subterranean', file: '/assets/backgrounds/bg_12_underdark_cavern.png', desc: 'Jamur raksasa ungu dan cyan memancarkan spora di danau bawah tanah' },
    { id: 'bg_13_lava_forge', name: 'Tempat Tempa Lahar Kurcaci', genre: 'Industrial Fantasy', file: '/assets/backgrounds/bg_13_lava_forge.png', desc: 'Sungai magma membara di bawah patung raksasa penempa kurcaci' },
    { id: 'bg_14_frost_peak', name: 'Puncak Tebing Badai Es', genre: 'Frozen Wilds', file: '/assets/backgrounds/bg_14_frost_peak.png', desc: 'Gargoyle es membeku di atas jurang gletser di bawah cahaya aurora' },
    { id: 'bg_15_haunted_graveyard', name: 'Pemakaman Gotik Berkabut', genre: 'Gothic Horror', file: '/assets/backgrounds/bg_15_haunted_graveyard.png', desc: 'Nisan condong berlumut dan burung gagak di bawah sinar bulan purnama' },
    { id: 'bg_16_swamp_huts', name: 'Rawa Purba & Pondok Nenek Sihir', genre: 'Folklore Horror', file: '/assets/backgrounds/bg_16_swamp_huts.png', desc: 'Pondok panggung kayu di atas air rawa berlumpur dengan lentera api' },
    { id: 'bg_17_desert_temple', name: 'Piramida Pasir Necropolis', genre: 'Ancient Mystery', file: '/assets/backgrounds/bg_17_desert_temple.png', desc: 'Patung Anubis raksasa mengawal koridor kuil pasir berpendar hieroglif' },
    { id: 'bg_18_celestial_sanctum', name: 'Sanctum Dimensi Astral', genre: 'Cosmic Fantasy', file: '/assets/backgrounds/bg_18_celestial_sanctum.png', desc: 'Platform marmer melayang di antara nebula bintang dan rasi galaksi' },
    { id: 'bg_19_shadowfell_citadel', name: 'Spire Dimensi Shadowfell', genre: 'Shadow Horror', file: '/assets/backgrounds/bg_19_shadowfell_citadel.png', desc: 'Benteng bayangan hitam runcing di bawah gerhana matahari ungu' },
    { id: 'bg_20_pirate_ship_deck', name: 'Geladak Galleon Badai Samudra', genre: 'High Seas', file: '/assets/backgrounds/bg_20_pirate_ship_deck.png', desc: 'Tiang kapal dan tali layar terombang-ambing di tengah kilat badai' },
    { id: 'bg_21_goblin_war_camp', name: 'Benteng Perang Suku Goblin', genre: 'Warband', file: '/assets/backgrounds/bg_21_goblin_war_camp.png', desc: 'Palisade kayu runcing dan kobaran api unggun perang malam hari' },
    { id: 'bg_22_crystal_mines', name: 'Tambang Kristal Aether', genre: 'Arcane Mine', file: '/assets/backgrounds/bg_22_crystal_mines.png', desc: 'Gugusan kristal mentah ungu memancarkan radiasi sihir murni' },
    { id: 'bg_23_dungeon_torture_chamber', name: 'Ruang Jeruji Penjara Bawah Tanah', genre: 'Grimdark', file: '/assets/backgrounds/bg_23_dungeon_torture_chamber.png', desc: 'Jeruji besi berkarat dan obor dinding menyala remang-remang' },
    { id: 'bg_24_feywild_glade', name: 'Lembah Senja Feywild', genre: 'Enchanted', file: '/assets/backgrounds/bg_24_feywild_glade.png', desc: 'Flora raksasa berpendar zamrud dan kunang-kunang di alam mimpi peri' },
    { id: 'bg_25_abandoned_cathedral', name: 'Reruntuhan Katedral Mawar Pecah', genre: 'Ruins', file: '/assets/backgrounds/bg_25_abandoned_cathedral.png', desc: 'Puing altar suci bermandikan berkas sinar matahari senja temaram' },
    { id: 'bg_26_clockwork_vault', name: 'Kubah Mesin Mechanus', genre: 'Clockwork', file: '/assets/backgrounds/bg_26_clockwork_vault.png', desc: 'Roda gigi kuningan raksasa berputar dalam harmoni mekanikal mutlak' },
    { id: 'bg_27_dragon_hoard', name: 'Sarang Tumpukan Harta Karun Naga', genre: 'Epic Fantasy', file: '/assets/backgrounds/bg_27_dragon_hoard.png', desc: 'Gunung koin emas berkilauan dan relik peradaban yang ditaklukkan' },
    { id: 'bg_28_city_market_alley', name: 'Lorong Kota Gotik Basah Hujan', genre: 'Urban Fantasy', file: '/assets/backgrounds/bg_28_city_market_alley.png', desc: 'Jalanan batu licin memantulkan cahaya lentera kuning gas malam hari' },
    { id: 'bg_29_abyssal_rift', name: 'Pusaran Retakan Dimensi Abyssal', genre: 'Cosmic Horror', file: '/assets/backgrounds/bg_29_abyssal_rift.png', desc: 'Lubang hitam dimensi berputar membuka gerbang ke jurang kehampaan' }
  ];

  const ITEMS_COLLECTION = [
    { id: 'item_01_potion_heal', name: 'Potion of Healing', category: 'Ramuan', file: '/assets/items/item_01_potion_heal.png', desc: 'Pulihkan 25 HP seketika' },
    { id: 'item_02_potion_mana', name: 'Potion of Mana', category: 'Ramuan', file: '/assets/items/item_02_potion_mana.png', desc: 'Pulihkan 20 Mana' },
    { id: 'item_03_grimoire', name: 'Grimoire Arkanum', category: 'Buku Mantra', file: '/assets/items/item_03_grimoire.png', desc: '+15 Max Mana' },
    { id: 'item_04_silver_dagger', name: 'Belati Perak Elf', category: 'Senjata', file: '/assets/items/item_04_silver_dagger.png', desc: 'Bonus Serangan Cepat' },
    { id: 'item_05_cursed_amulet', name: 'Jimat Kutukan Merah', category: 'Relik', file: '/assets/items/item_05_cursed_amulet.png', desc: 'Penangkal Kutukan Kegelapan' },
    { id: 'item_06_skeleton_key', name: 'Kunci Tengkorak Kuno', category: 'Kunci', file: '/assets/items/item_06_skeleton_key.png', desc: 'Buka pintu rahasia bawah tanah' },
    { id: 'item_07_golden_compass', name: 'Kompas Emas Astral', category: 'Alat', file: '/assets/items/item_07_golden_compass.png', desc: '+2 WIS Eksplorasi' },
    { id: 'item_08_dragon_shield', name: 'Perisai Sisik Naga', category: 'Zirah', file: '/assets/items/item_08_dragon_shield.png', desc: '+2 AC Pertahanan Tahan Api' },
    { id: 'item_09_gold_pouch', name: 'Kantong Koin Emas', category: 'Harta', file: '/assets/items/item_09_gold_pouch.png', desc: 'Koin emas petualang' },
    { id: 'item_10_elixir_vitality', name: 'Elixir of Vitality', category: 'Ramuan', file: '/assets/items/item_10_elixir_vitality.png', desc: 'Pulihkan seluruh status negatif' },
    { id: 'item_11_flame_sword', name: 'Pedang Api Abadi', category: 'Senjata', file: '/assets/items/item_11_flame_sword.png', desc: '+5 Serangan Elemen Api' },
    { id: 'item_12_teleport_scroll', name: 'Gulungan Teleportasi', category: 'Gulungan', file: '/assets/items/item_12_teleport_scroll.png', desc: 'Melarikan diri ke lokasi aman' },
    { id: 'item_13_shadow_ring', name: 'Cincin Bayangan Onyx', category: 'Aksesori', file: '/assets/items/item_13_shadow_ring.png', desc: '+3 Kemampuan Stealth' },
    { id: 'item_14_holy_water', name: 'Air Suci Mentari', category: 'Relik', file: '/assets/items/item_14_holy_water.png', desc: '30 Radiant Damage ke Undead' },
    { id: 'item_15_lockpick_set', name: 'Perangkat Pemetik Gembok', category: 'Alat', file: '/assets/items/item_15_lockpick_set.png', desc: 'Peralatan pencuri presisi' },
    { id: 'item_16_crown_kings', name: 'Mahkota Raja Safir', category: 'Artefak', file: '/assets/items/item_16_crown_kings.png', desc: 'Kebal sihir hipnotis & pesona' },
    { id: 'item_17_dragon_horn', name: 'Terompet Naga Hitam', category: 'Instrumen', file: '/assets/items/item_17_dragon_horn.png', desc: 'Panggil arwah sekutu tempur' },
    { id: 'item_18_meat_ration', name: 'Ransum Daging Asap', category: 'Makanan', file: '/assets/items/item_18_meat_ration.png', desc: 'Pulihkan stamina saat rehat' },
  ];

  const SKILLS_COLLECTION = [
    { id: 'skill_01_fireball', name: 'Fireball', category: 'Evocation', file: '/assets/skills/skill_01_fireball.png', desc: 'Ledakan bola api oranye membara' },
    { id: 'skill_02_heal', name: 'Holy Heal', category: 'Restoration', file: '/assets/skills/skill_02_heal.png', desc: 'Penyembuhan energi suci keemasan' },
    { id: 'skill_03_stealth', name: 'Stealth Mode', category: 'Rogue', file: '/assets/skills/skill_03_stealth.png', desc: 'Menghilang ke dalam bayangan malam' },
    { id: 'skill_04_shield', name: 'Shield Block', category: 'Defense', file: '/assets/skills/skill_04_shield.png', desc: 'Tangkisan perisai baja berkilau' },
    { id: 'skill_05_perception', name: 'Mata Persepsi', category: 'Divination', file: '/assets/skills/skill_05_perception.png', desc: 'Melihat rahasia tersembunyi' },
    { id: 'skill_06_strike', name: 'Critical Strike', category: 'Combat', file: '/assets/skills/skill_06_strike.png', desc: 'Tebasan pedang silang mematikan' },
    { id: 'skill_07_portal', name: 'Dimensi Portal', category: 'Conjuration', file: '/assets/skills/skill_07_portal.png', desc: 'Pusaran gerbang antardimensi' },
    { id: 'skill_08_lockpick', name: 'Lockpicking', category: 'Utility', file: '/assets/skills/skill_08_lockpick.png', desc: 'Membongkar gerigi kunci kuno' },
    { id: 'skill_09_intimidate', name: 'Auman Singa', category: 'Charisma', file: '/assets/skills/skill_09_intimidate.png', desc: 'Aura wibawa melumpuhkan moral musuh' },
    { id: 'skill_10_lightning', name: 'Sambaran Petir', category: 'Evocation', file: '/assets/skills/skill_10_lightning.png', desc: 'Kilatan petir azure menyengat lawan' },
    { id: 'skill_11_charm', name: 'Pesona Asmara', category: 'Enchantment', file: '/assets/skills/skill_11_charm.png', desc: 'Debu sihir membujuk pikiran musuh' },
    { id: 'skill_12_inspect', name: 'Investigasi Jejak', category: 'Investigation', file: '/assets/skills/skill_12_inspect.png', desc: 'Lensa runik mengungkap jejak gaib' },
  ];

  const PORTRAITS_COLLECTION = [
    { id: 'char_hero_01_paladin', name: 'Sir Gareth', role: 'Paladin (Hero)', file: '/assets/portraits/char_hero_01_paladin.png' },
    { id: 'char_hero_02_ranger', name: 'Lyra Windrunner', role: 'Ranger (Hero)', file: '/assets/portraits/char_hero_02_ranger.png' },
    { id: 'char_hero_03_wizard', name: 'Magus Ignis', role: 'Wizard (Hero)', file: '/assets/portraits/char_hero_03_wizard.png' },
    { id: 'char_hero_04_dwarf', name: 'Brom Ironbreaker', role: 'Barbarian (Hero)', file: '/assets/portraits/char_hero_04_dwarf.png' },
    { id: 'char_hero_05_rogue', name: 'Vesper Shadowcloak', role: 'Rogue (Hero)', file: '/assets/portraits/char_hero_05_rogue.png' },
    { id: 'char_hero_06_cleric', name: 'Sister Althea', role: 'Cleric (Hero)', file: '/assets/portraits/char_hero_06_cleric.png' },
    { id: 'char_hero_07_warlock', name: 'Malakor Bound', role: 'Warlock (Hero)', file: '/assets/portraits/char_hero_07_warlock.png' },
    { id: 'char_hero_08_dragonborn', name: 'Kaelen Vermithrax', role: 'Fighter (Hero)', file: '/assets/portraits/char_hero_08_dragonborn.png' },
    { id: 'char_hero_09_bard', name: 'Dorian Melodias', role: 'Bard (Hero)', file: '/assets/portraits/char_hero_09_bard.png' },
    { id: 'char_npc_01_barkeep', name: 'Eldrin', role: 'NPC Kedai', file: '/assets/portraits/char_npc_01_barkeep.png' },
    { id: 'char_npc_02_informant', name: 'Informan Bayangan', role: 'Sekutu Misterius', file: '/assets/portraits/char_npc_02_informant.png' },
    { id: 'char_npc_03_vampire', name: 'Lord Cassian', role: 'Bos Vampir', file: '/assets/portraits/char_npc_03_vampire.png' },
    { id: 'char_npc_04_necromancer', name: 'Malakor Necromancer', role: 'Bos Makam Merah', file: '/assets/portraits/char_npc_04_necromancer.png' },
    { id: 'char_npc_05_dryad', name: 'Sylvanis Dryad', role: 'Penjaga Rimba', file: '/assets/portraits/char_npc_05_dryad.png' },
    { id: 'char_npc_06_goblin', name: 'Gazlowe Pedagang', role: 'Pasar Gelap', file: '/assets/portraits/char_npc_06_goblin.png' },
    { id: 'char_npc_07_guard', name: 'Kapten Roderic', role: 'Komandan Penjaga', file: '/assets/portraits/char_npc_07_guard.png' },
    { id: 'char_npc_08_cultist', name: 'Pendeta Abyssal', role: 'Bos Kultus Abyssal', file: '/assets/portraits/char_npc_08_cultist.png' },
    { id: 'char_npc_09_lich', name: 'Kaisar Azgathoth', role: 'Bos Lich Terakhir', file: '/assets/portraits/char_npc_09_lich.png' },
    { id: 'monster_01_skeleton', name: 'Skeleton Warrior', role: 'Monster Undead', file: '/assets/monsters/monster_01_skeleton.png' },
    { id: 'monster_02_spider', name: 'Giant Cave Spider', role: 'Monster Gua', file: '/assets/monsters/monster_02_spider.png' },
    { id: 'monster_03_shadow_wolf', name: 'Shadow Wolf', role: 'Monster Bayangan', file: '/assets/monsters/monster_03_shadow_wolf.png' },
    { id: 'monster_04_mimic', name: 'Dungeon Mimic', role: 'Monster Peti Palsu', file: '/assets/monsters/monster_04_mimic.png' },
    { id: 'monster_05_gargoyle', name: 'Stone Gargoyle', role: 'Monster Tebing', file: '/assets/monsters/monster_05_gargoyle.png' },
    { id: 'monster_06_eldritch', name: 'Eldritch Abomination', role: 'Monster Dimensi', file: '/assets/monsters/monster_06_eldritch.png' },
    { id: 'monster_07_hydra', name: 'Venom Hydra', role: 'Monster Rawa', file: '/assets/monsters/monster_07_hydra.png' },
    { id: 'monster_08_hellhound', name: 'Hellhound', role: 'Monster Lahar Api', file: '/assets/monsters/monster_08_hellhound.png' },
    { id: 'monster_09_drake', name: 'Emerald Drake', role: 'Monster Naga Liar', file: '/assets/monsters/monster_09_drake.png' },
  ];

  const THREE_D_COLLECTION = [
    { id: 'd20_diffuse', name: 'D20 Diffuse Color Map', category: '3D Peta Warna', file: '/assets/3d/d20_diffuse.png', desc: 'Tekstur resin marun dengan ukiran emas 1-20' },
    { id: 'd20_normal', name: 'D20 Tangent Normal Map', category: '3D Bump Map', file: '/assets/3d/d20_normal.png', desc: 'Peta faset dan kedalaman ukiran dadu' },
    { id: 'd20_roughness', name: 'D20 Roughness Map', category: '3D Pantulan', file: '/assets/3d/d20_roughness.png', desc: 'Peta kilap specular marmer dadu RPG' },
    { id: 'cover_tavern', name: 'Whispering Tavern Banner', category: 'Campaign Cover', file: '/assets/covers/cover_tavern.jpg', desc: 'Banner sinematik kedai Oakhaven' },
    { id: 'cover_crypt', name: 'Crypt of Crimson Banner', category: 'Campaign Cover', file: '/assets/covers/cover_crypt.jpg', desc: 'Banner sinematik katakombe berdarah' },
    { id: 'cover_citadel', name: 'Sunken Citadel Banner', category: 'Campaign Cover', file: '/assets/covers/cover_citadel.jpg', desc: 'Banner sinematik istana bawah laut' },
    { id: 'frame_gold', name: 'Golden Character Frame', category: 'UI Chrome', file: '/assets/covers/frame_character_gold.png', desc: 'Bingkai potret emas transparan HUD' },
    { id: 'parchment_bg', name: 'Antique Parchment Texture', category: 'UI Texture', file: '/assets/covers/parchment_paper_bg.jpg', desc: 'Tekstur kertas perkamen tua dialog log' },
  ];

  const handleCopySvg = async (item) => {
    try {
      const res = await fetch(item.file);
      const svgText = await res.text();
      await navigator.clipboard.writeText(svgText);
      setCopiedSvgId(item.id);
      audio.playClick();
      if (showToast) showToast(`Kode SVG ${item.name} berhasil disalin!`, 'success');
      setTimeout(() => setCopiedSvgId(null), 2200);
    } catch {
      if (showToast) showToast(`Gagal menyalin kode SVG`, 'error');
    }
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-outfit selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full px-6 py-4 md:px-12 flex items-center justify-between bg-slate-950/70 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <a 
            href="/" 
            className="group flex items-center gap-2.5 text-slate-100 hover:text-amber-400 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-amber-500/40 flex items-center justify-center p-1 shadow-sm group-hover:border-amber-400 transition-colors">
              <IconSwords className="w-6 h-6" />
            </div>
            <span className="font-cinzel text-base md:text-lg font-bold tracking-wide text-white group-hover:text-amber-400 transition-colors">
              /aethermaster
            </span>
          </a>
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-semibold tracking-wider">
            Made by ADE7
          </span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <button 
            onClick={() => scrollToSection('campaigns')}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            Kampanye ({campaigns.length})
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          <button 
            onClick={() => setActiveModal('rules')}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            Sistem 5E
          </button>

          <button 
            onClick={() => setActiveModal('guide')}
            className="hover:text-white transition-colors"
          >
            Panduan
          </button>

          <button 
            onClick={() => setActiveModal('prompts')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:text-white transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Prompt Studio</span>
          </button>

          <button 
            onClick={() => { setActiveModal('icons'); setIconModalTab('svg'); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:text-white transition-colors"
          >
            <IconSwords className="w-3.5 h-3.5" />
            <span>Galeri Aset</span>
          </button>

          <a 
            href="https://github.com/ade781/AetherMaster-AI" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            GitHub
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </nav>

        {/* Top Right Save Load */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenSaveLoad}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg min-h-[40px]"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            Muat Save Game
          </button>
        </div>

        {/* Mobile Trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-xl px-6 py-5 flex flex-col gap-4 text-sm animate-fadeIn">
          <button 
            onClick={() => scrollToSection('campaigns')}
            className="text-left py-2 font-medium text-slate-200 hover:text-amber-400 min-h-[44px]"
          >
            Pilih Kampanye ({campaigns.length})
          </button>
          <button 
            onClick={() => { setMobileMenuOpen(false); setActiveModal('rules'); }}
            className="text-left py-2 font-medium text-slate-200 hover:text-amber-400 min-h-[44px]"
          >
            Sistem Aturan D&amp;D 5E
          </button>
          <button 
            onClick={() => { setMobileMenuOpen(false); setActiveModal('guide'); }}
            className="text-left py-2 font-medium text-slate-200 hover:text-amber-400 min-h-[44px]"
          >
            Panduan Bermain
          </button>
          <button 
            onClick={() => { setMobileMenuOpen(false); setActiveModal('prompts'); }}
            className="text-left py-2 font-medium text-purple-300 hover:text-white flex items-center gap-2 min-h-[44px]"
          >
            <Terminal className="w-4 h-4" />
            <span>Prompt Studio</span>
          </button>
          <button 
            onClick={() => { setMobileMenuOpen(false); setActiveModal('icons'); setIconModalTab('svg'); }}
            className="text-left py-2 font-medium text-amber-300 hover:text-white flex items-center gap-2 min-h-[44px]"
          >
            <IconSwords className="w-4 h-4" />
            <span>Galeri Aset</span>
          </button>
          <a 
            href="https://github.com/ade781/AetherMaster-AI" 
            target="_blank" 
            rel="noreferrer"
            className="py-2 flex items-center justify-between text-slate-200 hover:text-amber-400 min-h-[44px]"
          >
            <span>Repositori GitHub</span>
            <ExternalLink className="w-4 h-4 opacity-60" />
          </a>
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenSaveLoad(); }}
              className="w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-medium text-xs flex items-center justify-center gap-2 min-h-[44px]"
            >
              <BookOpen className="w-4 h-4" />
              Muat Save Game
            </button>
          </div>
        </div>
      )}

      {/* 1. Hero Banner Component */}
      <HeroBanner
        onStartAdventure={() => scrollToSection('campaigns')}
        onOpenRules={() => setActiveModal('rules')}
        showToast={showToast}
      />

      {/* 2. Dynamic Campaign Grid Component (Populated from DB) */}
      <CampaignGrid
        campaigns={campaigns}
        initLoading={initLoading}
        onSelectCampaign={onSelectCampaign}
      />

      {/* 3. Features Showcase Component */}
      <FeaturesShowcase />

      {/* 4. Footer */}
      <footer className="relative z-20 w-full border-t border-slate-800/80 bg-slate-950 py-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span>⚔️ AetherMaster VTT Platform</span>
          <span>•</span>
          <span>D&amp;D 5E Virtual Tabletop Engine</span>
          <span>•</span>
          <span className="text-amber-400 font-semibold">Made by ADE7</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setActiveModal('rules')} className="hover:text-slate-300 transition-colors">
            Aturan Sistem
          </button>
          <button onClick={() => setActiveModal('guide')} className="hover:text-slate-300 transition-colors">
            Panduan
          </button>
          <button onClick={() => setActiveModal('prompts')} className="hover:text-purple-300 transition-colors">
            Prompt Studio
          </button>
          <button onClick={() => { setActiveModal('icons'); setIconModalTab('svg'); }} className="hover:text-amber-300 transition-colors">
            Galeri Aset
          </button>
          <a href="https://github.com/ade781/AetherMaster-AI" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors">
            GitHub
          </a>
        </div>
      </footer>

      {/* 5. Prompt Studio Modal */}
      <PromptStudioModal
        isOpen={activeModal === 'prompts'}
        onClose={() => setActiveModal(null)}
        showToast={showToast}
      />

      {/* 6. Standard Modal Overlays */}
      {activeModal && activeModal !== 'prompts' && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Tutup jendela modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal: Sistem 5E */}
            {activeModal === 'rules' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Scroll className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-white">Sistem Aturan D&amp;D 5E</h3>
                    <p className="text-xs text-slate-400">Implementasi kalkulasi mekanik meja</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white">1. Ability Checks &amp; Logika Tindakan</h4>
                    <p>
                      Setiap aksi pemain memiliki atribut terkait (Kekuatan, Ketangkasan, Konstitusi, Kecerdasan, Kebijaksanaan, Karisma). Keberhasilan aksi dievaluasi dari skor atribut dan modifier karakter melawan tingkat kesulitan skenario.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white">2. Difficulty Class (DC)</h4>
                    <p>
                      Tingkat kesulitan ditentukan oleh konteks skenario: Mudah (DC 10), Sedang (DC 15), Sulit (DC 20), Sangat Sulit (DC 25). Jika aksi dan kalkulasi karakter memenuhi ambang DC, aksi dinyatakan berhasil.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-white">3. Evaluasi Konsekuensi &amp; Narasi Adaptif</h4>
                    <p>
                      Dungeon Master mengevaluasi tindakan berdasarkan logika dunia dan latar situasi, membuka cabang cerita baru atau memicu konsekuensi yang masuk akal secara dinamis.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
                  >
                    Mengerti
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Panduan Bermain */}
            {activeModal === 'guide' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-white">Panduan Memulai Petualangan</h3>
                    <p className="text-xs text-slate-400">Langkah mudah menjelajahi AetherMaster</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold shrink-0">1</span>
                    <div>
                      <h4 className="font-semibold text-white">Pilih Modul Kampanye</h4>
                      <p>Pilih salah satu dari 20 kampanye yang tersedia di grid arsip kampanye.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold shrink-0">2</span>
                    <div>
                      <h4 className="font-semibold text-white">Rakit Karakter Petualang</h4>
                      <p>Tentukan Ras (Human, Elf, Dwarf, Tiefling), Kelas (Paladin, Wizard, Rogue, Cleric, dll.), serta distribusikan atribut dasar.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold shrink-0">3</span>
                    <div>
                      <h4 className="font-semibold text-white">Tentukan Aksi &amp; Lempar Dadu D20</h4>
                      <p>Gunakan tombol pilihan aksi taktis atau ketik aksi bebas. Dadu D20 3D akan memvalidasi keberhasilan aksimu!</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
                  >
                    Siap Bertualang
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Galeri Aset */}
            {activeModal === 'icons' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center p-1.5 text-amber-400">
                      <IconSwords className="w-full h-full" />
                    </div>
                    <div>
                      <h3 className="font-cinzel text-xl font-bold text-white">Galeri Aset Visual &amp; Ikon</h3>
                      <p className="text-xs text-slate-400">Format vektor SVG &amp; PNG resolusi tinggi</p>
                    </div>
                  </div>

                  <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs flex-wrap gap-1">
                    <button
                      onClick={() => setIconModalTab('backgrounds')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        iconModalTab === 'backgrounds'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      29 Latar
                    </button>
                    <button
                      onClick={() => setIconModalTab('items')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        iconModalTab === 'items'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      18 Item
                    </button>
                    <button
                      onClick={() => setIconModalTab('skills')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        iconModalTab === 'skills'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      12 Skill
                    </button>
                    <button
                      onClick={() => setIconModalTab('portraits')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        iconModalTab === 'portraits'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      27 Karakter &amp; Bos
                    </button>
                    <button
                      onClick={() => setIconModalTab('svg')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        iconModalTab === 'svg'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      9 Vektor SVG
                    </button>
                    <button
                      onClick={() => setIconModalTab('three_d')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        iconModalTab === 'three_d'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      3D Dadu &amp; UI
                    </button>
                  </div>
                </div>

                {iconModalTab === 'svg' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {SVG_ICONS_COLLECTION.map((item) => {
                      const IconComp = item.component;
                      const isCopied = copiedSvgId === item.id;
                      return (
                        <div key={item.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center shrink-0">
                              <IconComp className="w-full h-full text-amber-400" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-white text-xs truncate">{item.name}</h4>
                              <p className="text-[10px] text-slate-400 line-clamp-1">{item.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-850">
                            <button
                              onClick={() => handleCopySvg(item)}
                              className="flex-1 py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 flex items-center justify-center gap-1 border border-slate-800"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Code className="w-3 h-3 text-amber-400" />}
                              <span>{isCopied ? 'Tersalin' : 'Salin SVG'}</span>
                            </button>
                            <a
                              href={item.file}
                              download={`${item.id}.svg`}
                              className="py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {iconModalTab === 'backgrounds' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {ALL_BACKGROUNDS_COLLECTION.map((bg) => (
                      <div key={bg.id} className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                        <div className="relative h-24 w-full bg-slate-900">
                          <img src={bg.file} alt={bg.name} className="w-full h-full object-cover" loading="lazy" />
                          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-amber-300">
                            {bg.genre}
                          </span>
                        </div>
                        <div className="p-2.5 space-y-1">
                          <h4 className="font-semibold text-white text-[11px] truncate">{bg.name}</h4>
                          <span className="text-[9px] font-mono text-slate-400 block">{bg.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {iconModalTab === 'items' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {ITEMS_COLLECTION.map((item) => (
                      <div key={item.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-2 text-center group hover:border-amber-500/50 transition-colors">
                        <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-800/80 p-1 flex items-center justify-center overflow-hidden">
                          <img src={item.file} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" loading="lazy" />
                        </div>
                        <div className="w-full">
                          <span className="text-[9px] font-semibold text-amber-400/90 uppercase tracking-wider block">{item.category}</span>
                          <h4 className="font-semibold text-white text-[11px] truncate">{item.name}</h4>
                          <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {iconModalTab === 'skills' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {SKILLS_COLLECTION.map((skill) => (
                      <div key={skill.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 group hover:border-amber-500/50 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 p-0.5 shrink-0 overflow-hidden">
                          <img src={skill.file} alt={skill.name} className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform" loading="lazy" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-semibold text-purple-400 uppercase tracking-wider block">{skill.category}</span>
                          <h4 className="font-semibold text-white text-xs truncate">{skill.name}</h4>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{skill.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {iconModalTab === 'portraits' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {PORTRAITS_COLLECTION.map((char) => (
                      <div key={char.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 group hover:border-amber-500/50 transition-colors">
                        <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 shrink-0 overflow-hidden">
                          <img src={char.file} alt={char.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" loading="lazy" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-semibold text-amber-400/80 truncate block">{char.role}</span>
                          <h4 className="font-semibold text-white text-xs truncate">{char.name}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {iconModalTab === 'three_d' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {THREE_D_COLLECTION.map((item) => (
                      <div key={item.id} className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col">
                        <div className="relative h-28 w-full bg-slate-900 flex items-center justify-center p-2">
                          <img src={item.file} alt={item.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                        </div>
                        <div className="p-2.5 space-y-1">
                          <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider block">{item.category}</span>
                          <h4 className="font-semibold text-white text-xs truncate">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
                  >
                    Tutup Galeri
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
