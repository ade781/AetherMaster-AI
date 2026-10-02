import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Flame,
  Shield,
  Clock,
  Compass,
  Scroll,
  X
} from 'lucide-react';
import { useCampaignStore } from '../../store/CampaignContext';
import CampaignLivePreviewCard from './CampaignLivePreviewCard';
import DynamicNpcModal from './DynamicNpcModal';
import FantasyButton from '../common/FantasyButton';
import FantasyBadge from '../common/FantasyBadge';
import audio from '../../services/audioService';

const SAMPLE_PROMPTS = [
  'Mencari pedang suci yang dicuri kultus bayangan di bawah kuil kuno.',
  'Menyelidiki kutukan air beracun yang menyebar dari reruntuhan samudra terendam.',
  'Menyusup ke menara alkimia terlarang sebelum portal retakan mana meledak.',
  'Melintasi gurun pasir terkutuk untuk memecahkan misteri makam raja firaun kuno.'
];

export default function CampaignBuilderStudio({
  isOpen,
  onClose,
  onStartCampaign
}) {
  const {
    step,
    setStep,
    selectedTheme,
    setSelectedTheme,
    selectedDifficulty,
    setSelectedDifficulty,
    storyLength,
    setStoryLength,
    narrativePrompt,
    setNarrativePrompt,
    isOfflineMode,
    setIsOfflineMode,
    generatedCampaign,
    isGenerating,
    error,
    generateCampaign,
    rerollNpc,
    updateNpc,
    resetBuilder,
    themes,
    difficulties
  } = useCampaignStore();

  const [activeNpcModal, setActiveNpcModal] = useState(null);

  if (!isOpen) return null;

  const currentThemeObj = themes.find(t => t.id === selectedTheme) || themes[0];
  const currentDiffObj = difficulties.find(d => d.id === selectedDifficulty) || difficulties[1];

  const handleNextStep = () => {
    audio.playClick();
    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3) {
      generateCampaign();
    }
  };

  const handlePrevStep = () => {
    audio.playClick();
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSelectSamplePrompt = (sample) => {
    audio.playClick();
    setNarrativePrompt(sample);
  };

  const handleCommitCampaign = () => {
    if (!generatedCampaign) return;
    audio.playSuccess();
    onStartCampaign?.(generatedCampaign);
    onClose?.();
  };

  const stepsMeta = [
    { num: 1, title: 'Tema & Setting' },
    { num: 2, title: 'Tingkat Bahaya' },
    { num: 3, title: 'Panduan Narasi AI' },
    { num: 4, title: 'Pratinjau Studio' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-xl flex flex-col font-outfit select-none animate-fadeIn">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 w-full px-6 py-4 bg-slate-950/90 border-b border-white/10 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
            <Wand2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-cinzel text-base md:text-lg font-bold text-white tracking-wide">
              Dynamic Campaign Studio
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Arsitektur Petualangan Prosedural &amp; D&amp;D 5E AI
            </p>
          </div>
        </div>

        {/* Stepper Progress Badges */}
        <div className="hidden md:flex items-center gap-2">
          {stepsMeta.map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all ${
                step === s.num
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : step > s.num
                  ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/5 text-slate-500 border border-white/5'
              }`}
            >
              <span>{s.num}.</span>
              <span>{s.title}</span>
            </div>
          ))}
        </div>

        {/* Close Studio Button */}
        <button
          type="button"
          onClick={() => {
            audio.playClick();
            onClose?.();
          }}
          className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Tutup Campaign Studio"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-between">
        {/* STEP 1: THEME & SETTING */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                Langkah 1 dari 3
              </span>
              <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-white">
                Pilih Tema &amp; Atmosfer Alam Semesta
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Setiap tema membentuk medan pertempuran, monster penghuni, dan corak narasi AI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {themes.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => {
                      audio.playClick();
                      setSelectedTheme(theme.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        setSelectedTheme(theme.id);
                      }
                    }}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-4 group ${
                      isSelected
                        ? 'bg-amber-950/20 border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/20'
                        : 'bg-slate-900/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FantasyBadge variant={theme.accentColor} size="sm">
                          {theme.name}
                        </FantasyBadge>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-amber-400" />
                        )}
                      </div>

                      <h3 className="font-cinzel text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                        {theme.tagline}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed font-light">
                        {theme.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Monster: {theme.suggestedEnemies[0]}</span>
                      <span className="text-amber-400/80 uppercase text-[9px] tracking-wider font-bold">
                        Pilih
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: DANGER LEVEL & STORY LENGTH */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                Langkah 2 dari 3
              </span>
              <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-white">
                Tentukan Tingkat Bahaya &amp; Durasi Petualangan
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Atur Challenge Rating (CR) D&amp;D 5E dan panjang percabangan naratif.
              </p>
            </div>

            {/* Difficulty Grid */}
            <div className="space-y-2.5">
              <h3 className="font-cinzel text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tingkat Kesulitan &amp; Skala Bahaya D&amp;D 5E
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {difficulties.map((diff) => {
                  const isSelected = selectedDifficulty === diff.id;
                  return (
                    <div
                      key={diff.id}
                      onClick={() => {
                        audio.playClick();
                        setSelectedDifficulty(diff.id);
                      }}
                      role="button"
                      tabIndex={0}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-400 shadow-lg ring-1 ring-amber-400/30'
                          : 'bg-slate-900/60 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <FantasyBadge variant={diff.badgeVariant} size="sm">
                            {diff.label}
                          </FantasyBadge>
                          <span className="font-mono text-xs text-amber-300 font-bold">
                            CR {diff.crModifier >= 0 ? `+${diff.crModifier}` : diff.crModifier}
                          </span>
                        </div>
                        <h4 className="font-cinzel text-sm font-bold text-white">
                          {diff.name}
                        </h4>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          {diff.description}
                        </p>
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-white/5">
                        HP Musuh: x{diff.enemyHpMultiplier}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Story Length Selection */}
            <div className="space-y-2.5 pt-4">
              <h3 className="font-cinzel text-xs font-bold text-slate-400 uppercase tracking-wider">
                Panjang Percabangan Babak Cerita
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[
                  { count: 3, label: 'One-Shot Sprint', duration: '~15 Menit', desc: 'Skenario singkat, langsung ke ruang konflik utama dan pertempuran boss ringkas.' },
                  { count: 7, label: 'Petualangan Standar', duration: '~35 Menit', desc: 'Format ideal dengan eksplorasi, pertemuan NPC, penyelidikan misteri, dan klimaks.' },
                  { count: 15, label: 'Kronik Epik', duration: '~75 Menit', desc: 'Kampanye panjang bercabang ganda, musuh elit, dan konsekuensi cerita berdampak luas.' }
                ].map((len) => {
                  const isSelected = storyLength === len.count;
                  return (
                    <div
                      key={len.count}
                      onClick={() => {
                        audio.playClick();
                        setStoryLength(len.count);
                      }}
                      role="button"
                      tabIndex={0}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-lg ring-1 ring-cyan-400/30'
                          : 'bg-slate-900/60 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-cinzel font-bold text-sm text-white">
                            {len.count} Babak Cerita
                          </span>
                          <span className="font-mono text-xs text-cyan-300">
                            {len.duration}
                          </span>
                        </div>
                        <h4 className="text-xs text-cyan-200/90 font-medium">
                          {len.label}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {len.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: AI NARRATIVE PROMPT */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto w-full">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                Langkah 3 dari 3
              </span>
              <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-white">
                Panduan Premis Narasi Petualangan
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Tuliskan premis atau pilih salah satu inspirasi hook petualangan di bawah.
              </p>
            </div>

            {/* Prompt Textarea */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wide">
                  Premis Petualangan Kustom:
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {narrativePrompt.length}/300 Karakter
                </span>
              </div>

              <textarea
                rows={4}
                maxLength={300}
                value={narrativePrompt}
                onChange={(e) => setNarrativePrompt(e.target.value)}
                placeholder="Contoh: Menyelidiki kastil terkutuk di mana waktu berhenti berdetak dan mencari pedang suci pelindung surga..."
                className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-outfit leading-relaxed"
              />

              {/* Sample Hook Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-mono">
                  Inspirasi Premis Cepat:
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PROMPTS.map((prompt, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleSelectSamplePrompt(prompt)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 text-[11px] transition-colors text-left cursor-pointer min-h-[36px]"
                    >
                      {prompt.slice(0, 48)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Offline Mock Toggle Option */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOfflineMode ? (
                  <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <Wifi className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-cinzel font-bold text-white">
                    Mode Pengujian Lokal (Mock Engine Adapter)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Memastikan pembuatan petualangan tetap 100% aktif tanpa ketergantungan server live backend.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOfflineMode(prev => !prev)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isOfflineMode ? 'bg-amber-500' : 'bg-slate-800'
                }`}
                role="switch"
                aria-checked={isOfflineMode}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isOfflineMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: LIVE PREVIEW STAGE */}
        {step === 4 && (
          <CampaignLivePreviewCard
            campaign={generatedCampaign}
            onOpenNpcModal={(npc) => setActiveNpcModal(npc)}
            onBackToEdit={() => setStep(3)}
            onStartAdventure={handleCommitCampaign}
            onRegenerateAll={generateCampaign}
          />
        )}

        {/* Wizard Footer Navigation Controls */}
        <footer className="pt-6 border-t border-white/10 flex items-center justify-between mt-auto">
          {step > 1 && step < 4 ? (
            <FantasyButton
              variant="secondary"
              size="md"
              icon={ArrowLeft}
              onClick={handlePrevStep}
              disabled={isGenerating}
            >
              Sebelumnya
            </FantasyButton>
          ) : (
            <FantasyButton
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isGenerating}
            >
              Batal
            </FantasyButton>
          )}

          {step < 3 && (
            <FantasyButton
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={handleNextStep}
            >
              Lanjutkan
            </FantasyButton>
          )}

          {step === 3 && (
            <FantasyButton
              variant="primary"
              size="lg"
              icon={Sparkles}
              sound="select"
              loading={isGenerating}
              onClick={handleNextStep}
              className="shadow-amber-500/20 shadow-xl"
            >
              {isGenerating ? 'Membangkitkan Petualangan AI...' : 'Bangkitkan Petualangan dengan AI'}
            </FantasyButton>
          )}
        </footer>
      </main>

      {/* Dynamic NPC Modal for inspecting / testing voice */}
      <DynamicNpcModal
        isOpen={Boolean(activeNpcModal)}
        onClose={() => setActiveNpcModal(null)}
        npc={activeNpcModal}
        onRerollNpc={async (id) => {
          await rerollNpc(id);
          // Refresh active modal with new data
          const updated = (generatedCampaign?.npcs || []).find(n => n.id === id);
          if (updated) setActiveNpcModal(updated);
        }}
        onSaveNpc={(id, fields) => {
          updateNpc(id, fields);
          setActiveNpcModal(null);
        }}
      />
    </div>
  );
}
