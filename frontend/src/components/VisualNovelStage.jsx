import React, { useState, useEffect, useCallback } from 'react';
import {
  Volume2, VolumeX, Mic, MicOff, BookOpen, GitFork, Save,
  Sparkles, Send, Compass, Target, Music, Check
} from 'lucide-react';
import audio from '../services/audioService';
import FantasyAvatar from './common/FantasyAvatar';

const BACKGROUND_MAP = {
  bg_01: 'bg_01_tavern',
  bg_01_tavern: 'bg_01_tavern',
  bg_02: 'bg_02_cursed_woods',
  bg_02_cursed_woods: 'bg_02_cursed_woods',
  bg_03: 'bg_03_sunken_citadel',
  bg_03_sunken_citadel: 'bg_03_sunken_citadel',
  bg_04: 'bg_04_crimson_crypt',
  bg_04_crimson_crypt: 'bg_04_crimson_crypt',
  bg_05: 'bg_05_vampire_castle',
  bg_05_vampire_castle: 'bg_05_vampire_castle',
  bg_06: 'bg_06_alchemy_lab',
  bg_06_alchemy_lab: 'bg_06_alchemy_lab',
  bg_07: 'bg_07_smuggler_cave',
  bg_07_smuggler_cave: 'bg_07_smuggler_cave',
  bg_08: 'bg_08_arcane_library',
  bg_08_arcane_library: 'bg_08_arcane_library',
  bg_09: 'bg_09_dragon_crater',
  bg_09_dragon_crater: 'bg_09_dragon_crater',
  bg_10: 'bg_10_ancient_ruins',
  bg_10_ancient_ruins: 'bg_10_ancient_ruins',
  bg_11: 'bg_11_throne_room',
  bg_11_throne_room: 'bg_11_throne_room',
  bg_12: 'bg_12_underdark_cavern',
  bg_12_underdark_cavern: 'bg_12_underdark_cavern',
  bg_13: 'bg_13_lava_forge',
  bg_13_lava_forge: 'bg_13_lava_forge',
  bg_14: 'bg_14_frost_peak',
  bg_14_frost_peak: 'bg_14_frost_peak',
  bg_15: 'bg_15_haunted_graveyard',
  bg_15_haunted_graveyard: 'bg_15_haunted_graveyard',
  bg_16: 'bg_16_swamp_huts',
  bg_16_swamp_huts: 'bg_16_swamp_huts',
  bg_17: 'bg_17_desert_temple',
  bg_17_desert_temple: 'bg_17_desert_temple',
  bg_18: 'bg_18_celestial_sanctum',
  bg_18_celestial_sanctum: 'bg_18_celestial_sanctum',
  bg_19: 'bg_19_shadowfell_citadel',
  bg_19_shadowfell_citadel: 'bg_19_shadowfell_citadel',
  bg_20: 'bg_20_pirate_ship_deck',
  bg_20_pirate_ship_deck: 'bg_20_pirate_ship_deck',
  bg_21: 'bg_21_goblin_war_camp',
  bg_21_goblin_war_camp: 'bg_21_goblin_war_camp',
  bg_22: 'bg_22_crystal_mines',
  bg_22_crystal_mines: 'bg_22_crystal_mines',
  bg_23: 'bg_23_dungeon_torture_chamber',
  bg_23_dungeon_torture_chamber: 'bg_23_dungeon_torture_chamber',
  bg_24: 'bg_24_feywild_glade',
  bg_24_feywild_glade: 'bg_24_feywild_glade',
  bg_25: 'bg_25_abandoned_cathedral',
  bg_25_abandoned_cathedral: 'bg_25_abandoned_cathedral',
  bg_26: 'bg_26_clockwork_vault',
  bg_26_clockwork_vault: 'bg_26_clockwork_vault',
  bg_27: 'bg_27_dragon_hoard',
  bg_27_dragon_hoard: 'bg_27_dragon_hoard',
  bg_28: 'bg_28_city_market_alley',
  bg_28_city_market_alley: 'bg_28_city_market_alley',
  bg_29: 'bg_29_abyssal_rift',
  bg_29_abyssal_rift: 'bg_29_abyssal_rift'
};

const PORTRAIT_MAP = {
  char_hero_01: 'char_hero_01_paladin',
  char_hero_01_paladin: 'char_hero_01_paladin',
  char_hero_02: 'char_hero_02_ranger',
  char_hero_02_ranger: 'char_hero_02_ranger',
  char_hero_03: 'char_hero_03_wizard',
  char_hero_03_wizard: 'char_hero_03_wizard',
  char_hero_04: 'char_hero_04_dwarf',
  char_hero_04_dwarf: 'char_hero_04_dwarf',
  char_hero_05: 'char_hero_05_rogue',
  char_hero_05_rogue: 'char_hero_05_rogue',
  char_hero_06: 'char_hero_06_cleric',
  char_hero_06_cleric: 'char_hero_06_cleric',
  char_hero_07: 'char_hero_07_warlock',
  char_hero_07_warlock: 'char_hero_07_warlock',
  char_hero_08: 'char_hero_08_dragonborn',
  char_hero_08_dragonborn: 'char_hero_08_dragonborn',
  char_hero_09: 'char_hero_09_bard',
  char_hero_09_bard: 'char_hero_09_bard',
  char_npc_01: 'char_npc_01_barkeep',
  char_npc_01_barkeep: 'char_npc_01_barkeep',
  char_npc_02: 'char_npc_02_informant',
  char_npc_02_informant: 'char_npc_02_informant',
  char_npc_03: 'char_npc_03_vampire',
  char_npc_03_vampire: 'char_npc_03_vampire',
  char_npc_04: 'char_npc_04_necromancer',
  char_npc_04_necromancer: 'char_npc_04_necromancer',
  char_npc_05: 'char_npc_05_dryad',
  char_npc_05_dryad: 'char_npc_05_dryad',
  char_npc_06: 'char_npc_06_goblin',
  char_npc_06_goblin: 'char_npc_06_goblin',
  char_npc_07: 'char_npc_07_guard',
  char_npc_07_guard: 'char_npc_07_guard',
  char_npc_08: 'char_npc_08_cultist',
  char_npc_08_cultist: 'char_npc_08_cultist',
  char_npc_09: 'char_npc_09_lich',
};

const BGM_TRACKS = [
  { id: 'auto', label: 'Otomatis Sesuai Adegan', icon: '🎲' },
  { id: 'tavern', label: 'Kedai & Kota (Tavern)', icon: '🍺' },
  { id: 'mystic', label: 'Mistik & Sihir (Arcadia)', icon: '✨' },
  { id: 'exploration', label: 'Reruntuhan & Kuil Kuno', icon: '🏰' },
  { id: 'dungeon', label: 'Ruang Bawah Tanah & Gua', icon: '🗡️' },
  { id: 'graveyard', label: 'Kastil Horor & Kuburan', icon: '💀' },
  { id: 'boss', label: 'Pertempuran Epik & Bos', icon: '🐉' },
  { id: 'combat', label: 'Pertarungan Taktis', icon: '⚔️' }
];

export default function VisualNovelStage({
  node,
  character,
  campaign,
  session,
  onChooseAction,
  onOpenStoryTree,
  onOpenSaveLoad,
  onToggleInventory,
  isLoading,
  hudComponent
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [customActionText, setCustomActionText] = useState('');
  const [selectedBgm, setSelectedBgm] = useState('auto');
  const [showBgmMenu, setShowBgmMenu] = useState(false);

  const fullText = node?.dialogueText || 'Kisahmu dimulai di alam semesta AetherMaster...';

  // Mission Log parsing
  let parsedLog = session?.missionLog;
  if (typeof parsedLog === 'string') {
    try {
      parsedLog = JSON.parse(parsedLog);
    } catch {
      parsedLog = null;
    }
  }

  const missionLog = {
    title: parsedLog?.title || campaign?.title || 'Jurnal Misi Petualang',
    prologue: parsedLog?.prologue || campaign?.description || 'Informasi latar belakang misi sedang disinkronkan oleh Dungeon Master. Selesaikan penyelidikan di lokasi saat ini.',
    targetGoal: parsedLog?.targetGoal || 'Tuntaskan investigasi dan netralkan sumber krisis.'
  };

  const paragraphs = String(missionLog.prologue || '')
    .split('\n')
    .map(p => p.trim())
    .filter(Boolean);

  // Skip typewriter handler
  const handleSkipTypewriter = useCallback(() => {
    if (isTyping) {
      setDisplayedText(fullText);
      setIsTyping(false);
    }
  }, [isTyping, fullText]);

  // Keyboard shortcut listener: Space/Enter skips, I toggles inventory, M opens story tree
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleSkipTypewriter();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        audio.playClick();
        onToggleInventory?.();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        audio.playClick();
        onOpenStoryTree?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkipTypewriter, onToggleInventory, onOpenStoryTree]);

  // Background music & ambient soundscape sync based on scene atmosphere & player choice
  const resolveSceneBgm = useCallback((bgId) => {
    const clean = (bgId || '').toLowerCase();
    if (clean.includes('dragon') || clean.includes('lava') || clean.includes('war_camp') || clean.includes('boss')) return 'boss';
    if (clean.includes('arcane') || clean.includes('celestial') || clean.includes('feywild') || clean.includes('crystal') || clean.includes('alchemy')) return 'mystic';
    if (clean.includes('ruins') || clean.includes('temple') || clean.includes('sunken') || clean.includes('vault') || clean.includes('smuggler') || clean.includes('pirate')) return 'exploration';
    if (clean.includes('graveyard') || clean.includes('vampire') || clean.includes('shadowfell') || clean.includes('torture') || clean.includes('swamp')) return 'graveyard';
    if (clean.includes('crypt') || clean.includes('dungeon') || clean.includes('cavern') || clean.includes('underdark') || clean.includes('frost')) return 'dungeon';
    return 'tavern';
  }, []);

  const activeTrack = selectedBgm === 'auto' ? resolveSceneBgm(node?.backgroundId) : selectedBgm;

  useEffect(() => {
    if (!soundEnabled) return;
    const volume = activeTrack === 'boss' ? 0.25 : (activeTrack === 'graveyard' ? 0.23 : 0.22);
    audio.playBGM(activeTrack, volume);
  }, [node?.backgroundId, selectedBgm, soundEnabled, activeTrack]);

  // Typewriter effect
  useEffect(() => {
    if (!fullText) return;
    setIsTyping(true);
    setDisplayedText('');

    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      setDisplayedText(fullText.slice(0, currentIdx));
      if (currentIdx >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 15);

    // Voice narration via Neural Edge TTS (Deep Indonesian Elder Voice) with Web Speech fallback
    if (speechEnabled) {
      audio.speakNarration(fullText);
    }

    return () => {
      clearInterval(interval);
      audio.stopSpeech();
    };
  }, [node?.id, fullText, speechEnabled]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audio.setMuted(!next);
  };

  const toggleSpeech = () => {
    const next = !speechEnabled;
    setSpeechEnabled(next);
    if (!next) {
      audio.stopSpeech();
    }
  };

  const getBackgroundSrc = (bgId) => {
    let resolved = bgId;
    if (!resolved || (resolved === 'bg_01_tavern' && campaign?.defaultBackgroundId && campaign.defaultBackgroundId !== 'bg_01_tavern')) {
      resolved = campaign?.defaultBackgroundId || 'bg_01_tavern';
    }
    if (resolved.startsWith('/') || resolved.startsWith('http')) return resolved;

    const clean = resolved.replace(/\.png$/i, '');
    const mapped = BACKGROUND_MAP[clean] || Object.values(BACKGROUND_MAP).find(v => v.includes(clean) || clean.includes(v)) || clean;
    return `/assets/backgrounds/${mapped}.png`;
  };

  const getPortraitSrc = (charId) => {
    if (!charId) return null;
    if (charId.startsWith('/') || charId.startsWith('http')) return charId;
    const clean = charId.replace(/\.png$/i, '');
    const mapped = PORTRAIT_MAP[clean] || Object.values(PORTRAIT_MAP).find(v => v === clean || v.includes(clean) || clean.includes(v)) || clean;
    return `/assets/portraits/${mapped}.png`;
  };

  const rawChoices = node?.choices;
  let choices = [];
  if (Array.isArray(rawChoices)) {
    choices = rawChoices;
  } else if (typeof rawChoices === 'string') {
    try {
      const parsed = JSON.parse(rawChoices);
      choices = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      choices = [];
    }
  } else if (rawChoices && typeof rawChoices === 'object') {
    choices = Object.values(rawChoices);
  }

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden bg-black select-none">

      {/* LEFT PANEL: Visual Stage (52%-60% on desktop/tablet) */}
      <div className="relative w-full md:w-[52%] lg:w-[56%] xl:w-[60%] h-[38vh] md:h-full overflow-hidden flex-shrink-0">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src={getBackgroundSrc(node?.backgroundId)}
            alt="Adventure Scene"
            className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05] transition-all duration-700 scale-[1.02]"
            onError={(e) => {
              const fallbackId = campaign?.defaultBackgroundId || 'bg_01_tavern';
              const fallbackMapped = BACKGROUND_MAP[fallbackId] || fallbackId;
              const target = `/assets/backgrounds/${fallbackMapped}.png`;
              if (!e.target.src.endsWith(target)) {
                e.target.src = target;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
        </div>

        {/* Top Stage Control Header */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 md:px-6 py-3 md:py-4 flex flex-wrap items-center justify-between gap-2">
          {/* Location & Chapter Pill */}
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full shadow-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-cinzel text-xs font-bold text-amber-300 tracking-wide drop-shadow-md">
              {node?.chapterTitle || 'Babak I: Takdir Dimulai'}
            </span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-xs text-slate-200 font-medium drop-shadow-md truncate max-w-[140px] sm:max-w-none">
              {node?.location || 'Aetheria'}
            </span>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-xl">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center ${soundEnabled ? 'text-amber-400 hover:bg-white/10' : 'text-slate-400 hover:bg-white/10'
                }`}
              title={soundEnabled ? 'Matikan SFX/Audio' : 'Nyalakan SFX/Audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Music / Backsound Switcher Button & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBgmMenu(prev => !prev)}
                className={`p-2 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center gap-1.5 ${
                  selectedBgm !== 'auto' ? 'text-cyan-300 bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Pilih Musik Latar Belakang (Backsound)"
              >
                <Music className="w-4 h-4 text-cyan-400" />
                <span className="hidden xl:inline text-[11px] font-medium text-slate-300 capitalize max-w-[80px] truncate">
                  {BGM_TRACKS.find(t => t.id === activeTrack)?.label.split(' ')[0] || 'Musik'}
                </span>
              </button>

              {showBgmMenu && (
                <div 
                  className="absolute top-12 right-0 w-64 bg-slate-950/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1 flex items-center justify-between">
                    <span>Musik Latar (Backsound)</span>
                    <span className="text-amber-400 font-mono text-[9px]">7 Trek RPG</span>
                  </div>
                  <div className="space-y-0.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                    {BGM_TRACKS.map(track => {
                      const isCurrent = (selectedBgm === track.id) || (selectedBgm === 'auto' && track.id === 'auto');
                      return (
                        <button
                          key={track.id}
                          onClick={() => {
                            audio.playClick();
                            setSelectedBgm(track.id);
                            setShowBgmMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition-all ${
                            isCurrent
                              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{track.icon}</span>
                            <span className="truncate">{track.label}</span>
                          </span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center ${speechEnabled ? 'text-amber-300 bg-white/10' : 'text-slate-400 hover:bg-white/10'
                }`}
              title={speechEnabled ? 'Matikan Narasi Suara' : 'Nyalakan Narasi Suara'}
            >
              {speechEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <div className="w-[1px] h-5 bg-white/20 my-auto" />
            <button
              onClick={() => { audio.playClick(); onOpenStoryTree(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all min-h-[40px]"
              title="Lihat Cabang Alur Cerita & Rewind (Hotkey: M)"
            >
              <GitFork className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Cabang</span>
            </button>
            <button
              onClick={() => { audio.playClick(); onOpenSaveLoad(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all min-h-[40px]"
              title="Simpan / Muat Permainan"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Simpan</span>
            </button>
          </div>
        </div>

        {/* Transparent Mission Journal Container (Restyled: Wide, Non-Scroll, Cinematic RPG Codex) */}
        <div className="absolute top-16 md:top-20 left-4 md:left-6 right-4 md:right-6 z-10 rounded-2xl bg-gradient-to-b from-slate-950/85 via-slate-900/75 to-slate-950/90 backdrop-blur-xl border border-amber-500/30 p-4 md:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] animate-fadeIn pointer-events-auto">
          {/* Top Subtle Amber Horizon Line */}
          <div className="absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-500/15">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-900/30 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <BookOpen className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                    Jurnal Misi
                  </span>
                  <h2 className="font-cinzel text-sm md:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100 tracking-wide">
                    {missionLog.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-0.5">
                  <span className="text-amber-200/90 font-medium">
                    {character?.name || 'Petualang'} sang {character?.characterClass || 'Pengelana'}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="capitalize text-slate-400">{character?.race || 'Human'}</span>
                </div>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 shadow-inner">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Babak {session?.turnCount || 1} dari {campaign?.totalActs || 12}</span>
            </div>
          </div>

          {/* Narrative Prologue & Objectives Grid (Wide Layout, No Scroll) */}
          <div className="mt-3.5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Latar Belakang & Catatan Penugasan */}
            <div className="lg:col-span-8 space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-amber-400/90">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span>Latar Belakang &amp; Catatan Penugasan</span>
              </div>
              <div className="space-y-1.5 text-slate-200 font-outfit text-xs md:text-sm leading-relaxed antialiased font-normal">
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, idx) => (
                    <p key={idx} className="first:text-slate-100 text-slate-300">
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="text-slate-400 italic">
                    Belum ada berkas narasi prolog tercatat.
                  </p>
                )}
              </div>
            </div>

            {/* Target Utama Misi */}
            <div className="lg:col-span-4 bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-black/60 border border-amber-500/30 rounded-xl p-3.5 flex flex-col gap-2 shadow-md">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-300 font-cinzel">
                <div className="p-1 rounded-md bg-amber-500/20 text-amber-300">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <span>Target Utama Misi</span>
              </div>
              <p className="font-outfit text-xs text-amber-100/90 leading-relaxed font-normal">
                {missionLog.targetGoal}
              </p>
            </div>
          </div>
        </div>

        {/* Character Portrait Card on Stage */}
        {node?.characterId && (
          <div className="absolute bottom-4 left-4 md:left-8 z-10 animate-fadeIn pointer-events-auto">
            <div className="w-40 sm:w-48 md:w-56 border-2 border-slate-700/80 bg-slate-950/90 shadow-2xl rounded-lg overflow-hidden backdrop-blur-sm">
              <div className="h-40 sm:h-48 md:h-56 overflow-hidden bg-black/40 flex items-center justify-center">
                <img
                  src={getPortraitSrc(node.characterId)}
                  alt={node.speaker || 'Karakter'}
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div className="bg-slate-900/95 py-1 px-2 text-center font-cinzel text-xs font-bold text-slate-200 border-t border-slate-700/80 tracking-wide truncate">
                {node.speaker || 'Karakter'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Story Dashboard (40%-48% on desktop/tablet) */}
      <div className="relative w-full md:w-[48%] lg:w-[44%] xl:w-[40%] flex-1 md:h-full flex flex-col bg-slate-950/95 border-t md:border-t-0 md:border-l border-white/10 shadow-2xl z-20 min-h-0 overflow-hidden">

        {/* Insert Top HUD */}
        {hudComponent}

        {/* Scrollable Story & Choice Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 flex flex-col gap-5 scrollbar-hide">

          <div className="flex-1">
            {/* Consequence Note Banner */}
            {node?.consequenceNote && (
              <div className="mb-4 bg-amber-500/10 border-l-4 border-amber-400 px-4 py-3 rounded-r-xl flex items-start gap-3 text-sm text-amber-200 animate-slideDown shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{node.consequenceNote}</span>
              </div>
            )}

            {/* Main Dialogue Box */}
            <div
              onClick={handleSkipTypewriter}
              className="relative bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl cursor-pointer group hover:bg-white/10 transition-colors"
            >
              {/* Speaker Nameplate */}
              <div className="absolute -top-3 left-6 bg-slate-950/90 backdrop-blur-md border border-white/20 px-4 py-1 rounded-full shadow-lg flex items-center gap-2">
                <span className="font-cinzel text-xs font-bold text-amber-300 tracking-widest uppercase">
                  {node?.speaker || 'Dungeon Master'}
                </span>
                {node?.mood && (
                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                    {node.mood}
                  </span>
                )}
              </div>

              {/* Typewriter Text */}
              <div className="mt-3 min-h-[70px]">
                <p className="font-outfit text-[14px] md:text-[15px] text-slate-200 leading-relaxed font-normal">
                  {displayedText}
                  {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse align-middle" />}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span className="hidden sm:inline text-slate-400">
                  Pintas: <kbd className="px-1 py-0.5 rounded bg-white/10 text-amber-300">Spasi</kbd> Lanjut • <kbd className="px-1 py-0.5 rounded bg-white/10 text-amber-300">I</kbd> Tas • <kbd className="px-1 py-0.5 rounded bg-white/10 text-cyan-300">M</kbd> Peta
                </span>
                <span className="tracking-wider uppercase ml-auto">
                  {isTyping ? 'Klik / Spasi Percepat' : 'Pilih tindakan di bawah'}
                </span>
              </div>
            </div>
          </div>

          {/* Choice Deck */}
          <div className="mt-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-3 animate-fadeIn border border-white/5 rounded-2xl bg-black/20">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-slate-800 border-t-amber-400 animate-spin"></div>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                </div>
                <span className="font-cinzel text-amber-300 text-xs font-bold tracking-widest uppercase animate-pulse">
                  Menenun Takdir...
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Prominent Free Action Input (Roleplay Bebas) */}
                <div className="bg-black/50 border border-amber-500/30 hover:border-amber-400/60 focus-within:border-amber-400 rounded-2xl p-3 shadow-xl transition-all backdrop-blur-md">
                  <div className="flex items-center justify-between gap-2 mb-2 px-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>Ketik Aksi Bebas (Roleplay)</span>
                    </div>
                    <span className="text-[10px] text-amber-400/80 font-mono bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-bold">
                      ✨ Aksi Narasi Bebas
                    </span>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!customActionText.trim() || isLoading) return;
                      audio.playClick();
                      onChooseAction({ id: 'custom', customText: customActionText.trim(), tone: 'kreatif' });
                      setCustomActionText('');
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={customActionText}
                      onChange={(e) => setCustomActionText(e.target.value)}
                      placeholder="Ketik aksimu... (misal: 'Aku menginterogasi pedagang', 'Aku merapalkan sihir', dll.)"
                      disabled={isLoading}
                      className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl text-xs md:text-sm text-slate-100 placeholder-slate-500 px-3.5 py-2.5 outline-none font-outfit min-h-[42px] transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !customActionText.trim()}
                      className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md min-h-[42px] flex items-center gap-1.5 flex-shrink-0"
                      title="Kirim Aksi"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Lakukan</span>
                    </button>
                  </form>
                </div>

                {/* Divider to Quick Suggested Actions */}
                {choices.length > 0 && (
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <div className="flex-1 h-[1px] bg-white/10" />
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      atau pilih saran taktis
                    </span>
                    <div className="flex-1 h-[1px] bg-white/10" />
                  </div>
                )}

                {/* Quick Suggested Choices */}
                <div className="flex flex-col gap-2">
                  {choices.map((choice, idx) => {
                    const hasReqItem = !choice.requiredItem || (character?.inventory || []).some(i => {
                      if (!choice.requiredItem) return true;
                      const req = String(choice.requiredItem).toLowerCase().trim();
                      const itemId = String(i.id || '').toLowerCase().trim();
                      const itemName = String(i.name || '').toLowerCase().trim();
                      return itemId === req || itemName === req || itemName.includes(req) || req.includes(itemName);
                    });

                    return (
                      <button
                        key={choice.id || idx}
                        disabled={!hasReqItem}
                        onClick={() => {
                          audio.playClick();
                          onChooseAction(choice);
                        }}
                        className={`px-3.5 py-2.5 rounded-xl border text-left flex items-start gap-3 transition-all min-h-[44px] ${!hasReqItem
                          ? 'bg-black/40 border-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-amber-400/30 text-slate-200 hover:text-white shadow-sm hover:-translate-y-0.5'
                          }`}
                      >
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center flex-shrink-0 text-amber-300 text-[10px] font-bold font-cinzel">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 uppercase tracking-wider font-bold">
                              {choice.tone || 'Aksi'}
                            </span>
                            {choice.requiredItem && !hasReqItem && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-900/40 text-red-300 border border-red-800/50 uppercase font-bold">
                                Butuh {choice.requiredItem}
                              </span>
                            )}
                          </div>
                          <p className="text-xs md:text-[13px] font-medium leading-snug">
                            {choice.text}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
